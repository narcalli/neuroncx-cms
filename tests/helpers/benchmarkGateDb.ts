import 'dotenv/config'
import { createLocalReq, getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { benchmarkStatusEndpoint, checkBenchmark } from '@/lifecycle/benchmarkGate'
import { contentHash } from '@/lifecycle/contentHash'
import type { Rubric, Sector, User } from '@/payload-types'

/**
 * The publish gate against the local database, with temporary records
 * (zz-gate-, ZZ GATE). Registered from tests/int/benchmark.int.spec.ts, after
 * that file's rubric tests: only one rubric can be Active, so these and the
 * rubric swap tests must not run at the same time, and tests in one file run
 * one after another.
 */
export const describeGateWithDatabase = () =>
describe('with the local database', () => {
  let payload: Payload
  let admin: User
  let owner: User
  let author: User
  let rubric: Rubric
  let sector: Sector
  let skip = false
  const runs: string[] = []
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
  const password = `zz-gate-${Date.now()}`
  const as = (user: User) => ({ ...user, collection: 'users' as const, _strategy: 'local-jwt' })
  const events = async () =>
    (
      await payload.find({
        ...quiet,
        collection: 'contentEvents',
        where: { and: [{ collectionSlug: { equals: 'sectors' } }, { doc: { equals: sector.id } }] },
        sort: '-createdAt',
        pagination: false,
      })
    ).docs as unknown as { action: string; note?: string | null }[]
  // A publish writes the gate's verdict, then History's own published event.
  const GATE_ACTIONS = ['benchmarkPassed', 'benchmarkFailed', 'notScored']
  const lastGateEvent = async () => (await events()).find((e) => GATE_ACTIONS.includes(e.action))!
  const latestVersion = async () =>
    (await payload.findVersions({ ...quiet, collection: 'sectors', where: { parent: { equals: sector.id } }, sort: '-updatedAt', limit: 1 })).docs[0]
  const publish = (data: Partial<Sector>, user: User | null = admin) =>
    payload.update({
      ...quiet,
      collection: 'sectors',
      id: sector.id,
      data: { ...data, _status: 'published' },
      ...(user ? { user: as(user), overrideAccess: false } : {}),
    })
  const recordRun = async (states: ('pass' | 'warning')[]) => {
    const version = await latestVersion()
    const run = await payload.create({
      ...quiet,
      collection: 'benchmarkRuns',
      data: {
        document: { relationTo: 'sectors', value: sector.id },
        versionId: String(version.id),
        rubric: rubric.id,
        rubricVersion: String(rubric.version),
        runAt: new Date().toISOString(),
        results: states.map((state, i) => ({ itemId: `ZG-0${i + 1}`, state, decidedBy: 'human' as const })),
      },
      user: as(admin),
      overrideAccess: false,
    })
    runs.push(run.id)
    return run
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const realActive = await payload.find({
      ...quiet,
      collection: 'rubrics',
      where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }, { name: { not_like: 'ZZ GATE' } }] },
      draft: false,
    })
    // Publishing a test rubric as Active would retire a real one.
    skip = realActive.docs.length > 0
    if (skip) return
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-gate-' } } })
    admin = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-gate-admin@example.test', password, role: 'admin' } })
    owner = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-gate-owner@example.test', password, role: 'contentOwner' } })
    author = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-gate-author@example.test', password, role: 'author' } })
    const item = (itemId: string) => ({
      itemId,
      dimension: 'extractability' as const,
      criterion: 'A check.',
      passCondition: 'It passes.',
      severityIfFailed: 'warning' as const,
      appliesTo: ['sectors' as const],
    })
    rubric = await payload.create({
      ...quiet,
      collection: 'rubrics',
      data: { name: 'ZZ GATE rubric', status: 'active', items: ['ZG-01', 'ZG-02', 'ZG-03'].map(item), _status: 'published' } as RequiredDataFromCollectionSlug<'rubrics'>,
      user: as(admin),
      overrideAccess: false,
    })
    sector = await payload.create({
      ...quiet,
      collection: 'sectors',
      draft: true,
      data: { name: 'ZZ GATE sector', slug: 'zz-gate-sector', summary: 'A test industry for the benchmark gate.', hasOwnPage: false, _status: 'draft' },
    })
  })
  afterAll(async () => {
    if (skip) return
    for (const id of runs) await payload.delete({ ...quiet, collection: 'benchmarkRuns', id }).catch(() => undefined)
    if (sector) {
      await payload.delete({ ...quiet, collection: 'contentEvents', where: { doc: { equals: sector.id } } }).catch(() => undefined)
      await payload.delete({ ...quiet, collection: 'sectors', id: sector.id }).catch(() => undefined)
    }
    if (rubric) await payload.delete({ ...quiet, collection: 'rubrics', id: rubric.id }).catch(() => undefined)
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-gate-' } } })
  })

  it('records a publish with no run as not scored, for an entry with no page of its own', async (ctx) => {
    if (skip) ctx.skip()
    const saved = await publish({ name: 'ZZ GATE sector' })
    expect(saved._status).toBe('published')
    const last = await lastGateEvent()
    expect(last).toMatchObject({ action: 'notScored' })
    expect(last.note).toMatch(/no benchmark run for this exact content against "ZZ GATE rubric" version 1/)
  })

  it('gives a run the content hash of the version it scored', async (ctx) => {
    if (skip) ctx.skip()
    const run = await recordRun(['pass', 'pass', 'pass'])
    expect(run.contentHash).toBe(contentHash((await latestVersion()).version))
  })

  it('records a pass when the run for this exact content clears the gate', async (ctx) => {
    if (skip) ctx.skip()
    await publish({ name: 'ZZ GATE sector' })
    const last = await lastGateEvent()
    expect(last).toMatchObject({ action: 'benchmarkPassed', note: 'Passes: scored 100 against a gate of 75.' })
  })

  it('records a failure without stopping the publish', async (ctx) => {
    if (skip) ctx.skip()
    await recordRun(['pass', 'warning', 'warning'])
    const saved = await publish({ name: 'ZZ GATE sector' })
    expect(saved._status).toBe('published')
    const last = await lastGateEvent()
    expect(last).toMatchObject({ action: 'benchmarkFailed', note: 'Below the gate: scored 33.3 against a gate of 75.' })
  })

  it('treats edited content as not scored, since no run covers it', async (ctx) => {
    if (skip) ctx.skip()
    await publish({ name: 'ZZ GATE sector, edited' })
    const last = await lastGateEvent()
    expect(last.action).toBe('notScored')
  })

  it('records nothing for a publish with nobody signed in', async (ctx) => {
    if (skip) ctx.skip()
    const before = (await events()).length
    await publish({ name: 'ZZ GATE sector, by a job' }, null)
    const after = await events()
    expect(after.length - before).toBe(1)
    expect(after[0].action).toBe('published')
  })

  it('shows the last saved version in the sidebar status endpoint', async (ctx) => {
    if (skip) ctx.skip()
    const req = await createLocalReq({ user: as(admin) }, payload)
    req.routeParams = { id: sector.id }
    const res = await benchmarkStatusEndpoint('sectors').handler(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ mode: 'warn', state: 'notScored', rubricName: 'ZZ GATE rubric' })
  })

  describe('the override', () => {
    it('cannot be set by an author', async (ctx) => {
      if (skip) ctx.skip()
      const saved = await payload.update({
        ...quiet,
        collection: 'sectors',
        id: sector.id,
        draft: true,
        data: { gateOverride: true, gateOverrideReason: 'Author tried' },
        user: as(author),
        overrideAccess: false,
      })
      expect(saved.gateOverride).toBeFalsy()
      expect(saved.gateOverrideHash).toBeFalsy()
    })

    it('needs a reason', async (ctx) => {
      if (skip) ctx.skip()
      const attempt = payload.update({ ...quiet, collection: 'sectors', id: sector.id, draft: true, data: { gateOverride: true }, user: as(owner), overrideAccess: false })
      await expect(attempt).rejects.toMatchObject({
        data: { errors: [expect.objectContaining({ path: 'gateOverrideReason', message: 'Give the reason for overriding the benchmark gate.' })] },
      })
    })

    it('is tied to the content it was set for and logged in History', async (ctx) => {
      if (skip) ctx.skip()
      const saved = await payload.update({
        ...quiet,
        collection: 'sectors',
        id: sector.id,
        draft: true,
        data: { gateOverride: true, gateOverrideReason: 'Launch week, scored by hand' },
        user: as(owner),
        overrideAccess: false,
      })
      expect(saved.gateOverrideHash).toBe(contentHash(saved))
      expect((await checkBenchmark(await createLocalReq({}, payload), 'sectors', sector.id, saved as unknown as Record<string, unknown>)).overridden).toBe(true)
      const [last] = await events()
      expect(last).toMatchObject({ action: 'overrideSet', note: 'Override of the benchmark gate: Launch week, scored by hand' })
      // Editing the content ends it: the hash no longer matches.
      const edited = await payload.update({ ...quiet, collection: 'sectors', id: sector.id, draft: true, data: { name: 'ZZ GATE sector, changed' }, user: as(owner), overrideAccess: false })
      expect((await checkBenchmark(await createLocalReq({}, payload), 'sectors', sector.id, edited as unknown as Record<string, unknown>)).overridden).toBe(false)
    })

    it('is not shown to visitors of the published entry', async (ctx) => {
      if (skip) ctx.skip()
      // Live, so a visitor can read the entry at all.
      await publish({ status: 'live', gateOverride: true, gateOverrideReason: 'Internal note' }, owner)
      const visitor = await payload.findByID({ ...quiet, collection: 'sectors', id: sector.id, overrideAccess: false })
      expect(visitor).not.toHaveProperty('gateOverride')
      expect(visitor).not.toHaveProperty('gateOverrideReason')
      expect(visitor).not.toHaveProperty('gateOverrideHash')
      const signedIn = await payload.findByID({ ...quiet, collection: 'sectors', id: sector.id, user: as(author), overrideAccess: false })
      expect(signedIn).toMatchObject({ gateOverride: true, gateOverrideReason: 'Internal note' })
    })
  })
})
