import 'dotenv/config'
import { getPayload, type Field, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { BenchmarkRuns } from '@/collections/BenchmarkRuns'
import { Rubrics } from '@/collections/Rubrics'
import { ContentStandards } from '@/ContentStandards/config'
import { gateFor } from '@/lifecycle/gate'
import { scoreResults, type ResultState } from '@/lifecycle/score'
import { verdictFor } from '@/lifecycle/verdict'
import type { Rubric, User } from '@/payload-types'

/**
 * Rubrics, benchmark runs and content standards (stage 2 of the content
 * lifecycle). The last group uses the local database with temporary records
 * (zz-bench-, ZZ BENCH), deleted afterwards.
 */

const states = (...s: ResultState[]) => s.map((state) => ({ state }))

describe('the score', () => {
  it('is passes over the items that apply, as a percentage', () => {
    expect(scoreResults(states('pass', 'pass', 'pass', 'pass'))).toEqual({ score: 100, blockerCount: 0 })
    expect(scoreResults(states('pass', 'pass', 'pass', 'warning', 'blocker'))).toEqual({ score: 60, blockerCount: 1 })
  })

  it('leaves not applicable items out of the total', () => {
    expect(scoreResults(states('pass', 'pass', 'pass', 'warning', 'blocker', 'na', 'na'))).toEqual({ score: 60, blockerCount: 1 })
    expect(scoreResults(states('pass', 'na', 'na'))).toEqual({ score: 100, blockerCount: 0 })
  })

  it('counts warnings and blockers alike against the score, and only blockers as blockers', () => {
    expect(scoreResults(states('warning', 'warning'))).toEqual({ score: 0, blockerCount: 0 })
    expect(scoreResults(states('blocker', 'blocker', 'pass'))).toEqual({ score: 33.3, blockerCount: 2 })
  })

  it('rounds to one decimal', () => {
    expect(scoreResults(states('pass', 'pass', 'warning')).score).toBe(66.7)
    expect(scoreResults(states('pass', 'warning', 'warning', 'warning', 'warning', 'warning', 'warning')).score).toBe(14.3)
    expect(scoreResults(states('pass', 'pass', 'pass', 'pass', 'pass', 'warning', 'warning', 'warning')).score).toBe(62.5)
  })

  it('is empty when no item applies, rather than dividing by zero', () => {
    expect(scoreResults(states('na', 'na'))).toEqual({ score: null, blockerCount: 0 })
    expect(scoreResults([])).toEqual({ score: null, blockerCount: 0 })
  })
})

describe('the verdict', () => {
  it('passes a score that reaches the gate, and fails one below it', () => {
    expect(verdictFor({ score: 90, blockerCount: 0 }, 90)).toBe('pass')
    expect(verdictFor({ score: 95.5, blockerCount: 0 }, 90)).toBe('pass')
    expect(verdictFor({ score: 89.9, blockerCount: 0 }, 90)).toBe('fail')
  })

  it('fails any blocker, whatever the score', () => {
    expect(verdictFor({ score: 100, blockerCount: 1 }, 0)).toBe('fail')
  })

  it('fails a run with no score, as a fallback for any recorded before such runs were refused', () => {
    expect(verdictFor({ score: null, blockerCount: 0 }, 0)).toBe('fail')
  })

  it('follows the gate it is given, so a changed gate changes old runs without rewriting them', () => {
    const run = { score: 87, blockerCount: 0 }
    expect([verdictFor(run, 85), verdictFor(run, 90)]).toEqual(['pass', 'fail'])
  })
})

describe('the gate', () => {
  const standards = { defaultGate: 85, gates: [{ collection: 'sectors' as const, gate: 90 }] }

  it("uses the collection's row, else the default gate", () => {
    expect(gateFor(standards, 'sectors')).toBe(90)
    expect(gateFor(standards, 'microApps')).toBe(85)
    expect(gateFor({ defaultGate: 70, gates: null }, 'industryTopics')).toBe(70)
  })

  it('starts at 85, with 90 for the three knowledge base collections', () => {
    const [defaultGate, gates] = ContentStandards.fields as [Field & { defaultValue: unknown }, Field & { defaultValue: unknown }]
    expect(defaultGate.defaultValue).toBe(85)
    expect(gates.defaultValue).toEqual([
      { collection: 'sectors', gate: 90 },
      { collection: 'industryTopics', gate: 90 },
      { collection: 'microApps', gate: 90 },
    ])
  })
})

describe('admin copy', () => {
  type Described = { name?: string; label?: unknown; admin?: { description?: unknown }; fields?: Described[] }
  const walk = (fields: Described[], prefix = ''): [string, Described][] =>
    fields
      // Loading the Payload config adds id to array rows and the timestamps; they are not ours.
      .filter((f) => !['id', 'createdAt', 'updatedAt'].includes(f.name ?? ''))
      .flatMap((f) => [[`${prefix}${f.name}`, f] as [string, Described], ...walk(f.fields ?? [], `${prefix}${f.name}.`)])

  it.each([
    ['rubrics', Rubrics.fields],
    ['benchmarkRuns', BenchmarkRuns.fields],
    ['contentStandards', ContentStandards.fields],
  ])('%s: every field has a description, and nothing has an em dash', (_, fields) => {
    for (const [path, f] of walk(fields as Described[])) {
      expect(f.admin?.description, path).toBeTruthy()
      expect(JSON.stringify([f.label, f.admin?.description]), path).not.toContain('—')
    }
  })
})

describe('with the local database', () => {
  let payload: Payload
  let admin: User
  let author: User
  let sector: { id: string; versionId: string }
  const rubrics: string[] = []
  const runs: string[] = []
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
  const password = `zz-bench-${Date.now()}`
  const as = (user: User, strategy = 'local-jwt') => ({ ...user, collection: 'users' as const, _strategy: strategy })
  const item = (itemId: string): NonNullable<Rubric['items']>[number] => ({
    itemId,
    dimension: 'extractability',
    criterion: 'States the outcome in the first sentence.',
    passCondition: 'The first sentence names the outcome.',
    severityIfFailed: 'blocker',
    appliesTo: ['sectors'],
  })
  // Saves as the admin, signed in: publishes unless publish is false.
  const saveRubric = async (data: Partial<Rubric>, id?: string, publish = true): Promise<Rubric> => {
    const opts = { ...quiet, collection: 'rubrics' as const, user: as(admin), overrideAccess: false }
    const body = { ...data, _status: publish ? ('published' as const) : ('draft' as const) }
    if (id) return payload.update({ ...opts, id, draft: !publish, data: body })
    const doc = publish
      ? await payload.create({ ...opts, data: body as RequiredDataFromCollectionSlug<'rubrics'> })
      : await payload.create({ ...opts, draft: true, data: body })
    rubrics.push(doc.id)
    return doc
  }
  const rejectedWith = (path: string, message: string | RegExp) => ({
    data: { errors: expect.arrayContaining([expect.objectContaining({ path, message: expect.stringMatching(message) })]) },
  })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-bench-' } } })
    await payload.delete({ ...quiet, collection: 'rubrics', where: { name: { like: 'ZZ BENCH' } } })
    admin = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-bench-admin@example.test', password, role: 'admin' } })
    author = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-bench-author@example.test', password, role: 'author' } })
    const doc = await payload.create({
      ...quiet,
      collection: 'sectors',
      draft: true,
      data: { name: 'ZZ BENCH sector', slug: 'zz-bench-sector', hasOwnPage: false, _status: 'draft' },
    })
    const versions = await payload.findVersions({ ...quiet, collection: 'sectors', where: { parent: { equals: doc.id } }, limit: 1 })
    sector = { id: doc.id, versionId: versions.docs[0].id }
  })
  afterAll(async () => {
    for (const id of runs) await payload.delete({ ...quiet, collection: 'benchmarkRuns', id }).catch(() => undefined)
    for (const id of rubrics) await payload.delete({ ...quiet, collection: 'rubrics', id }).catch(() => undefined)
    if (sector) await payload.delete({ ...quiet, collection: 'sectors', id: sector.id }).catch(() => undefined)
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-bench-' } } })
  })

  describe('rubrics', () => {
    it('lets only admins write them', async () => {
      const attempt = payload.create({
        ...quiet,
        collection: 'rubrics',
        draft: true,
        data: { name: 'ZZ BENCH by author', _status: 'draft' },
        user: as(author),
        overrideAccess: false,
      })
      await expect(attempt).rejects.toMatchObject({ status: 403 })
    })

    it('numbers a version only when a publish changes the items, ignoring any version sent', async () => {
      const first = await saveRubric({ name: 'ZZ BENCH numbered', status: 'retired', items: [item('NU-01')], version: 99 })
      expect(first.version).toBe(1)
      // A new name, a status change and a plain republish keep the number.
      expect((await saveRubric({ name: 'ZZ BENCH numbered, renamed', version: 50 }, first.id)).version).toBe(1)
      expect((await saveRubric({ status: 'active' }, first.id, false)).version).toBe(1)
      expect((await saveRubric({ status: 'retired' }, first.id)).version).toBe(1)
      // An item added, or one item's wording changed, is a new version.
      expect((await saveRubric({ items: [item('NU-01'), item('NU-02')] }, first.id)).version).toBe(2)
      const reworded = [item('NU-01'), { ...item('NU-02'), passCondition: 'The first sentence names the outcome and the date.' }]
      expect((await saveRubric({ items: reworded }, first.id)).version).toBe(3)
      // A draft shows the version last published; a reorder alone is not a change.
      expect((await saveRubric({ items: [item('NU-01')] }, first.id, false)).version).toBe(3)
      expect((await saveRubric({ items: [reworded[1], reworded[0]] }, first.id)).version).toBe(3)
    })

    it('retires the Active rubric when another is published as Active, recording which it superseded', async (ctx) => {
      const published = { ...quiet, collection: 'rubrics' as const, draft: false, overrideAccess: true }
      const realActive = (await payload.find({ ...published, where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }, { name: { not_like: 'ZZ BENCH' } }] } })).docs
      // Publishing a test rubric as Active would retire a real one.
      if (realActive.length) ctx.skip()
      const a = await saveRubric({ name: 'ZZ BENCH active A', status: 'active', items: [item('AC-01')] })
      // A draft of A that is not finished: the swap must not publish it.
      await saveRubric({ name: 'ZZ BENCH active A, unfinished draft' }, a.id, false)
      const b = await saveRubric({ name: 'ZZ BENCH active B', status: 'active', items: [item('AC-01')] }, undefined, false)
      expect(b).toMatchObject({ status: 'active', _status: 'draft', supersedes: null })
      const live = await saveRubric({}, b.id)
      expect(live).toMatchObject({ status: 'active', _status: 'published', supersedes: a.id })
      const oldA = await payload.findByID({ ...published, id: a.id })
      // Retired without being renumbered: its checks did not change.
      expect(oldA).toMatchObject({ status: 'retired', _status: 'published', name: 'ZZ BENCH active A', version: 1 })
      const active = await payload.find({ ...published, where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }] } })
      expect(active.docs.map((r) => r.id)).toEqual([b.id])
      // Republishing B supersedes nothing new and keeps the record.
      expect((await saveRubric({ name: 'ZZ BENCH active B again' }, b.id)).supersedes).toBe(a.id)
      await saveRubric({ status: 'retired' }, b.id)
    })

    it('takes supersedes from nobody but itself', async () => {
      const r = await saveRubric({ name: 'ZZ BENCH supersedes', status: 'retired', items: [item('SU-01')], supersedes: 'abc' })
      expect(r.supersedes).toBeNull()
    })

    it('refuses two items with one ID', async () => {
      const attempt = saveRubric({ name: 'ZZ BENCH twice', status: 'retired', items: [item('TW-01'), item('TW-01')] })
      await expect(attempt).rejects.toMatchObject(rejectedWith('items', /TW-01 is used more than once/))
    })

    it('retires an item ID once a published version drops it', async () => {
      const r = await saveRubric({ name: 'ZZ BENCH retire', status: 'retired', items: [item('RT-01'), item('RT-02')] })
      // Dropped in a draft only: it can still come back.
      await saveRubric({ items: [item('RT-01')] }, r.id, false)
      await saveRubric({ items: [item('RT-01'), item('RT-02')] }, r.id, false)
      // Dropped in a published version: retired for good.
      await saveRubric({ items: [item('RT-01')] }, r.id)
      await expect(saveRubric({ items: [item('RT-01'), item('RT-02')] }, r.id, false)).rejects.toMatchObject(
        rejectedWith('items', /RT-02 was removed/),
      )
      expect((await saveRubric({ items: [item('RT-01'), item('RT-03')] }, r.id)).items?.map((i) => i.itemId)).toEqual(['RT-01', 'RT-03'])
    })
  })

  describe('benchmark runs', () => {
    let rubric: Rubric
    const runData = () => ({
      document: { relationTo: 'sectors' as const, value: sector.id },
      versionId: sector.versionId,
      rubric: rubric.id,
      rubricVersion: '1',
      runAt: '2026-11-10T09:00:00.000Z',
      results: [
        { itemId: 'BR-01', state: 'pass' as const },
        { itemId: 'BR-02', state: 'warning' as const },
        { itemId: 'BR-03', state: 'na' as const },
      ],
    })

    beforeAll(async () => {
      rubric = await saveRubric({ name: 'ZZ BENCH runs', status: 'retired', items: [item('BR-01'), item('BR-02'), item('BR-03')] })
    })

    it('works out score and blockers itself, ignoring what the request sends', async () => {
      // runAt left out: it defaults to now.
      const { runAt: _runAt, ...untimed } = runData()
      const sent = { ...untimed, score: 100, blockerCount: 9, runBy: admin.id }
      const run = await payload.create({
        ...quiet,
        collection: 'benchmarkRuns',
        data: sent as RequiredDataFromCollectionSlug<'benchmarkRuns'>,
        user: as(author, 'api-key'),
        overrideAccess: false,
      })
      runs.push(run.id)
      expect(run).toMatchObject({ score: 50, blockerCount: 0, runBy: author.id, rubricVersion: '1' })
      // Pass or fail is never stored: the gate works it out when it reads the run.
      expect(run).not.toHaveProperty('verdict')
      expect(Date.now() - new Date(run.runAt).getTime()).toBeLessThan(60_000)
    })

    it('counts blockers', async () => {
      const data = { ...runData(), results: [{ itemId: 'BR-01', state: 'blocker' as const }, { itemId: 'BR-02', state: 'pass' as const }] }
      const run = await payload.create({ ...quiet, collection: 'benchmarkRuns', data, user: as(author, 'api-key'), overrideAccess: false })
      runs.push(run.id)
      expect(run).toMatchObject({ score: 50, blockerCount: 1 })
    })

    it('cannot be changed by anyone, even with access checks skipped', async () => {
      const run = await payload.create({ ...quiet, collection: 'benchmarkRuns', data: runData(), user: as(admin), overrideAccess: false })
      runs.push(run.id)
      const edit = { ...quiet, collection: 'benchmarkRuns' as const, id: run.id, data: { rubricVersion: '2' } }
      await expect(payload.update({ ...edit, user: as(admin), overrideAccess: false })).rejects.toMatchObject({ status: 403 })
      await expect(payload.update({ ...edit, overrideAccess: true })).rejects.toMatchObject({
        status: 403,
        message: 'Benchmark runs cannot be changed. Record a new run instead.',
      })
      expect((await payload.findByID({ ...quiet, collection: 'benchmarkRuns', id: run.id })).rubricVersion).toBe('1')
    })

    it('can be deleted by admins only', async () => {
      const run = await payload.create({ ...quiet, collection: 'benchmarkRuns', data: runData(), user: as(admin), overrideAccess: false })
      runs.push(run.id)
      const attempt = payload.delete({ ...quiet, collection: 'benchmarkRuns', id: run.id, user: as(author), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject({ status: 403 })
      await payload.delete({ ...quiet, collection: 'benchmarkRuns', id: run.id, user: as(admin), overrideAccess: false })
    })

    it('needs the ID of a saved version of the scored document', async () => {
      for (const versionId of ['not-a-version', rubric.id]) {
        const attempt = payload.create({ ...quiet, collection: 'benchmarkRuns', data: { ...runData(), versionId }, user: as(admin), overrideAccess: false })
        await expect(attempt, versionId).rejects.toMatchObject(rejectedWith('versionId', /not a saved version/))
      }
    })

    it('needs a published version of the rubric', async () => {
      for (const rubricVersion of ['2', 'one']) {
        const attempt = payload.create({ ...quiet, collection: 'benchmarkRuns', data: { ...runData(), rubricVersion }, user: as(admin), overrideAccess: false })
        await expect(attempt, rubricVersion).rejects.toMatchObject(rejectedWith('rubricVersion', `no published version ${rubricVersion}`))
      }
      const unpublished = await saveRubric({ name: 'ZZ BENCH never published', status: 'retired', items: [item('BR-01')] }, undefined, false)
      const attempt = payload.create({
        ...quiet,
        collection: 'benchmarkRuns',
        data: { ...runData(), rubric: unpublished.id },
        user: as(admin),
        overrideAccess: false,
      })
      await expect(attempt).rejects.toMatchObject(rejectedWith('rubricVersion', 'no published version 1'))
    })

    it("needs every result to be an item in that version, naming the ones that are not", async () => {
      const results = [{ itemId: 'BR-01', state: 'pass' as const }, { itemId: 'XX-01', state: 'pass' as const }, { itemId: 'XX-02', state: 'na' as const }]
      const attempt = payload.create({ ...quiet, collection: 'benchmarkRuns', data: { ...runData(), results }, user: as(admin), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject(rejectedWith('results', 'Not items in version 1 of the rubric: XX-01, XX-02.'))
    })

    it("checks results against the version named, not the rubric's latest", async () => {
      const r = await saveRubric({ name: 'ZZ BENCH versions', status: 'retired', items: [item('VS-01'), item('VS-02')] })
      await saveRubric({ items: [item('VS-01'), item('VS-03')] }, r.id)
      const run = (rubricVersion: string, itemId: string) =>
        payload.create({
          ...quiet,
          collection: 'benchmarkRuns',
          data: { ...runData(), rubric: r.id, rubricVersion, results: [{ itemId, state: 'pass' as const }] },
          user: as(admin),
          overrideAccess: false,
        })
      const old = await run('1', 'VS-02')
      runs.push(old.id)
      await expect(run('2', 'VS-02')).rejects.toMatchObject(rejectedWith('results', 'VS-02'))
      const current = await run('2', 'VS-03')
      runs.push(current.id)
    })

    it('refuses a run where every result is Not applicable, naming the content type and rubric version', async () => {
      const results = [{ itemId: 'BR-01', state: 'na' as const }, { itemId: 'BR-02', state: 'na' as const }]
      const attempt = payload.create({ ...quiet, collection: 'benchmarkRuns', data: { ...runData(), results }, user: as(admin), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject(
        rejectedWith('results', 'no item in version 1 of "ZZ BENCH runs" applies to Industries'),
      )
    })

    it('refuses two results for one item', async () => {
      const data = { ...runData(), results: [{ itemId: 'BR-01', state: 'pass' as const }, { itemId: 'BR-01', state: 'warning' as const }] }
      const attempt = payload.create({ ...quiet, collection: 'benchmarkRuns', data, user: as(admin), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject(rejectedWith('results', /BR-01 has more than one/))
    })
  })

  describe('content standards', () => {
    it('reads as the starting gates before anyone saves it', async () => {
      const standards = await payload.findGlobal({ ...quiet, slug: 'contentStandards' })
      if (standards.updatedAt) return // Saved on this machine: the defaults no longer apply.
      expect(standards.defaultGate).toBe(85)
      expect(standards.gates?.map(({ collection, gate }) => ({ collection, gate }))).toEqual([
        { collection: 'sectors', gate: 90 },
        { collection: 'industryTopics', gate: 90 },
        { collection: 'microApps', gate: 90 },
      ])
    })

    it('refuses two rows for one collection, and gates outside 0 to 100', async () => {
      const gates = [{ collection: 'sectors' as const, gate: 90 }, { collection: 'sectors' as const, gate: 80 }]
      const twice = payload.updateGlobal({ ...quiet, slug: 'contentStandards', data: { defaultGate: 85, gates }, user: as(admin), overrideAccess: false })
      await expect(twice).rejects.toMatchObject(rejectedWith('gates', /sectors has more than one/))
      const high = payload.updateGlobal({ ...quiet, slug: 'contentStandards', data: { defaultGate: 101 }, user: as(admin), overrideAccess: false })
      await expect(high).rejects.toMatchObject({ data: { errors: expect.arrayContaining([expect.objectContaining({ path: 'defaultGate' })]) } })
    })

    it('lets only admins change it', async () => {
      const attempt = payload.updateGlobal({ ...quiet, slug: 'contentStandards', data: { defaultGate: 50 }, user: as(author), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject({ status: 403 })
    })
  })
})
