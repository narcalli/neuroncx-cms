/**
 * Scores content against the frozen rubric (scripts/seed-rubric-v4.ts) and
 * records benchmark runs for the publish gate (src/lifecycle/benchmarkGate.ts).
 * No model is called. Code decides every check it can
 * (scripts/benchmark/mechanical.ts); the rest go on a worksheet a person or an
 * agent fills in (scripts/benchmark/worksheet.ts), which is read back into the
 * run. Each result records whether code or a person decided it.
 *
 * Usage (from neuroncx-cms), with NODE_OPTIONS="--no-deprecation --import=tsx/esm":
 *
 *   node --env-file=.env scripts/benchmark.ts accuracy [--from <cms url>]
 *     Scores the ten hand-scored entries as published on the live CMS, the code
 *     checks in code and the rest taken from the hand scores, and compares with
 *     the hand scores (within 5 points on every entry to pass). Writes
 *     scripts/benchmark/accuracy.json, which is committed: runs are recorded only
 *     while it shows a pass for this exact scorer.
 *
 *   node --env-file=.env scripts/benchmark.ts worksheet --collection <slug> [--slug <entry>] [--remote]
 *     For the latest saved version of each entry, writes a worksheet to
 *     calibration/ (ignored through .git/info/exclude) with the checks code
 *     could not decide and the text each needs.
 *
 *   node --env-file=.env scripts/benchmark.ts record --worksheet <file> --as <email> [--remote]
 *     Reads a filled worksheet, decides the code checks again on the same
 *     version, and records the benchmark run as that user. Refuses an
 *     incomplete worksheet, a changed version, or a rubric other than the
 *     frozen v4 as Active.
 *
 * Runs only against a database on this machine unless --remote is given.
 */
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'
import { contentHash } from '../src/lifecycle/contentHash'
import { LIFECYCLE_SLUGS, type LifecycleCollection } from '../src/lifecycle/scope'
import { scoreResults, type ResultState } from '../src/lifecycle/score'
import { buildEntry, str, type Doc, type Entry, type Refs } from './benchmark/entry'
import { HAND_SCORES_V3 } from './benchmark/handScores'
import { decide, decideOrganisations, decideProductNames, type Verdict } from './benchmark/mechanical'
import { fingerprintOf, NAME_CHECKS, readWorksheet, worksheetFor, type WorksheetMeta } from './benchmark/worksheet'
import { RUBRIC_V4 } from './seed-rubric-v4'

const say = (s = '') => fs.writeSync(1, s + '\n')
const args = process.argv.slice(2)
const command = args[0]
const flag = (name: string) => args.includes(name)
const option = (name: string) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const FROM = (option('--from') || 'https://main.duebzy83yxxuo.amplifyapp.com').replace(/\/$/, '')
const OUT = path.resolve('calibration')
const ACCURACY_FILE = path.resolve('scripts/benchmark/accuracy.json')
const TOLERANCE = 5
/** Bump when a mechanical check changes, so an old accuracy pass no longer counts. */
const MECHANICAL_VERSION = 2
export const FINGERPRINT = fingerprintOf(
  RUBRIC_V4.map(({ itemId, criterion, passCondition }) => ({ itemId, criterion, passCondition })),
  MECHANICAL_VERSION,
)

type Decided = Record<string, { state: ResultState; note: string }>

const severity = (id: string) => RUBRIC_V4.find((i) => i.itemId === id)!.severityIfFailed
const stateOf = (id: string, v: Verdict): ResultState => (v === 'pass' ? 'pass' : v === 'na' ? 'na' : severity(id))

/** What code decides, and what it hands to a person (with what it found). */
export const splitChecks = (e: Entry, refs: Refs) => {
  const decided: Decided = {}
  const toFill: string[] = []
  const hints: Record<string, string | undefined> = {}
  for (const item of RUBRIC_V4) {
    const d = decide(item.itemId, e, refs)
    if ('verdict' in d) decided[item.itemId] = { state: stateOf(item.itemId, d.verdict), note: d.note }
    else {
      toFill.push(item.itemId)
      hints[item.itemId] = d.hint
    }
  }
  return { decided, toFill, hints }
}

// ---------------------------------------------------------------- sources

const nameOf = (d: Doc) => str(d.name) || str(d.title) || str(d.slug)

const fetchDocs = async (url: string): Promise<Doc[]> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      return ((await res.json()) as { docs: Doc[] }).docs
    } catch (err) {
      if (attempt === 4) throw err
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}
const livePublished = (collection: string, depth = 1) =>
  fetchDocs(`${FROM}/api/${collection}?depth=${depth}&limit=200&where[_status][equals]=published`)

const refsFrom = async (payload: Payload, published: (c: string) => Promise<Doc[]>): Promise<Refs> => {
  const names = async (c: string) => (await published(c)).map(nameOf).filter(Boolean)
  const standards = await payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true })
  return {
    catalogue: [...(await names('features')), ...(await names('microApps')), ...(await names('integrations')), ...(await names('crmFeatures'))],
    integrations: await names('integrations'),
    customers: await names('customers'),
    thirdParties: (standards.allowedThirdParties ?? []).map((r) => r.name),
    terms: (standards.terms ?? []).map((r) => r.term),
    audiences: (standards.audienceWords ?? []).map((r) => r.word),
    channels: (standards.channelWords ?? []).map((r) => r.word),
  }
}

const visitorRefs = (payload: Payload) =>
  refsFrom(payload, async (c) =>
    (await payload.find({ collection: c as LifecycleCollection, where: { _status: { equals: 'published' } }, draft: false, depth: 0, pagination: false, overrideAccess: false })).docs as unknown as Doc[],
  )

const requireLocal = () => {
  const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
  if (!local && !flag('--remote')) {
    say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
    process.exit(1)
  }
}

/** The published Active rubric, only if it is the frozen v4 the scorer was checked against. */
const activeV3 = async (payload: Payload) => {
  const active = await payload.find({
    collection: 'rubrics',
    where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }] },
    draft: false,
    limit: 1,
    overrideAccess: true,
  })
  const r = active.docs[0]
  const same = r && JSON.stringify((r.items ?? []).map((i) => [i.itemId, i.passCondition])) === JSON.stringify(RUBRIC_V4.map((i) => [i.itemId, i.passCondition]))
  return r && same && r.version ? { id: r.id, version: String(r.version) } : null
}

// ---------------------------------------------------------------- accuracy

const accuracy = async (payload: Payload) => {
  const refs = await refsFrom(payload, (c) => livePublished(c, 0))
  const entries: Record<string, unknown>[] = []
  let passed = true
  const disagreements: Record<string, number> = {}
  for (const hand of HAND_SCORES_V3) {
    const doc = (await livePublished(hand.collection)).find((d) => d.slug === hand.slug)
    if (!doc) {
      say(`${hand.collection}/${hand.slug}: not published any more.`)
      passed = false
      continue
    }
    const entry = await buildEntry(payload, hand.collection, doc)
    const { decided, toFill } = splitChecks(entry, refs)
    // The checks code cannot decide are scored by hand, so they take the hand scores.
    const combined = RUBRIC_V4.map((i) => ({ state: decided[i.itemId]?.state ?? hand.states[i.itemId] }))
    const scorer = scoreResults(combined).score ?? 0
    const handScore = scoreResults(Object.values(hand.states).map((state) => ({ state }))).score ?? 0
    const differ = Object.entries(decided).filter(([id, r]) => r.state !== hand.states[id])
    for (const [id] of differ) disagreements[id] = (disagreements[id] ?? 0) + 1
    const within = Math.abs(scorer - handScore) <= TOLERANCE
    passed &&= within
    say(`${hand.collection}/${hand.slug}: hand ${handScore} | scorer ${scorer} | code decided ${Object.keys(decided).length}/34, ${toFill.length} by hand | ${within ? 'within' : 'OUTSIDE'} ${TOLERANCE}`)
    for (const [id, r] of differ) say(`    ${id}: code ${r.state}, hand ${hand.states[id]}. ${r.note}`)
    entries.push({
      collection: hand.collection,
      slug: hand.slug,
      hand: handScore,
      scorer,
      within,
      decidedByCode: Object.keys(decided).length,
      byHand: toFill,
      disagreements: differ.map(([id, r]) => ({ id, code: r.state, hand: hand.states[id], note: r.note })),
    })
  }
  say('')
  say(Object.keys(disagreements).length ? `Code and hand disagree on: ${Object.entries(disagreements).map(([id, n]) => `${id} (${n})`).join(', ')}` : 'Code and hand agree on every check code decides.')
  say(passed ? `PASSED: every entry within ${TOLERANCE} points.` : `FAILED: not every entry is within ${TOLERANCE} points. Runs will not be recorded.`)
  fs.writeFileSync(
    ACCURACY_FILE,
    JSON.stringify(
      {
        fingerprint: FINGERPRINT,
        passed,
        tolerance: TOLERANCE,
        at: new Date().toISOString(),
        method:
          'Code checks scored in code; the checks code cannot decide were scored by hand (scripts/benchmark/handScores.ts), as they are on every worksheet. Compared with the hand scores for the whole rubric.',
        entries,
      },
      null,
      1,
    ) + '\n',
  )
  say(`Written to ${ACCURACY_FILE}`)
}

// ---------------------------------------------------------------- worksheet

const worksheet = async (payload: Payload) => {
  const collection = option('--collection') as LifecycleCollection | undefined
  if (!collection || !LIFECYCLE_SLUGS.includes(collection)) {
    say(`Name a collection with --collection: ${LIFECYCLE_SLUGS.join(', ')}.`)
    process.exit(1)
  }
  requireLocal()
  const rubric = await activeV3(payload)
  if (!rubric) {
    say('No worksheet: the Active rubric is not the frozen v4 (publish scripts/seed-rubric-v4.ts as Active first).')
    process.exit(1)
  }
  const refs = await visitorRefs(payload)
  const slug = option('--slug')
  const docs = await payload.find({ collection, where: slug ? { slug: { equals: slug } } : {}, draft: true, depth: 0, pagination: false, overrideAccess: true })
  fs.mkdirSync(OUT, { recursive: true })
  for (const doc of docs.docs) {
    const latest = await payload.findVersions({ collection, where: { parent: { equals: doc.id } }, sort: '-updatedAt', limit: 1, depth: 1, overrideAccess: true })
    const version = latest.docs[0]
    if (!version) continue
    const entry = await buildEntry(payload, collection, version.version as unknown as Doc)
    const { decided, toFill, hints } = splitChecks(entry, refs)
    const meta: WorksheetMeta = {
      collection,
      entryId: String(doc.id),
      slug: entry.slug,
      versionId: String(version.id),
      contentHash: contentHash(version.version),
      rubricId: rubric.id,
      rubricVersion: rubric.version,
      fingerprint: FINGERPRINT,
    }
    const items = RUBRIC_V4.filter((i) => toFill.includes(i.itemId))
    const file = path.join(OUT, `worksheet-${collection}-${entry.slug}.md`)
    fs.writeFileSync(file, worksheetFor(entry, meta, items, hints, decided))
    say(`${file}: ${Object.keys(decided).length} decided by code, ${items.length} to fill in`)
  }
}

// ---------------------------------------------------------------- record

const record = async (payload: Payload) => {
  requireLocal()
  const file = option('--worksheet')
  const email = option('--as')
  if (!file || !email) {
    say('Give --worksheet <file> and --as <email>.')
    process.exit(1)
  }
  const accuracyCheck = fs.existsSync(ACCURACY_FILE) ? (JSON.parse(fs.readFileSync(ACCURACY_FILE, 'utf8')) as { fingerprint?: string; passed?: boolean }) : null
  if (!accuracyCheck?.passed || accuracyCheck.fingerprint !== FINGERPRINT) {
    say('Refusing to record: the scorer has no passing accuracy check for this exact rubric and code (run "accuracy").')
    process.exit(1)
  }
  const text = fs.readFileSync(file, 'utf8')
  const meta = readWorksheet(text, []).meta
  if (meta.fingerprint !== FINGERPRINT) {
    say('Refusing to record: this worksheet was made by a different rubric or scorer. Make a new one.')
    process.exit(1)
  }
  const rubric = await activeV3(payload)
  if (!rubric || rubric.id !== meta.rubricId || rubric.version !== meta.rubricVersion) {
    say('Refusing to record: the Active rubric is not the one this worksheet was made for.')
    process.exit(1)
  }
  const collection = meta.collection as LifecycleCollection
  const version = await payload.findVersionByID({ collection, id: meta.versionId, depth: 1, overrideAccess: true }).catch(() => null)
  if (!version || contentHash(version.version) !== meta.contentHash) {
    say('Refusing to record: the version on the worksheet is gone or its content has changed.')
    process.exit(1)
  }
  const refs = await visitorRefs(payload)
  const entry = await buildEntry(payload, collection, version.version as unknown as Doc)
  // Code checks decided again on the same version: the same answers as on the worksheet.
  const { decided, toFill } = splitChecks(entry, refs)
  const items = RUBRIC_V4.filter((i) => toFill.includes(i.itemId))
  const filled = readWorksheet(text, items)
  if (filled.problems.length) {
    say('Refusing to record: the worksheet is not finished.')
    for (const p of filled.problems) say(`  ${p}`)
    process.exit(1)
  }
  const results: { itemId: string; state: ResultState; note: string; decidedBy: 'code' | 'human' }[] = []
  for (const item of RUBRIC_V4) {
    const id = item.itemId
    if (decided[id]) {
      results.push({ itemId: id, state: decided[id].state, note: decided[id].note, decidedBy: 'code' })
    } else if (id in NAME_CHECKS) {
      // A person listed the names; code decides against the lists.
      const r = id === 'hr-no-client-names' ? decideOrganisations(filled.names[id], entry, refs) : decideProductNames(filled.names[id], entry, refs)
      results.push({ itemId: id, state: stateOf(id, r.verdict), note: r.note, decidedBy: 'human' })
    } else {
      const a = filled.answers[id]
      results.push({ itemId: id, state: stateOf(id, a.verdict), note: a.note, decidedBy: 'human' })
    }
  }
  const users = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  const user = users.docs[0]
  if (!user) {
    say(`No user with the email ${email}.`)
    process.exit(1)
  }
  const run = await payload.create({
    collection: 'benchmarkRuns',
    data: {
      document: { relationTo: collection, value: meta.entryId },
      versionId: meta.versionId,
      rubric: rubric.id,
      rubricVersion: rubric.version,
      runAt: new Date().toISOString(),
      results: results.map((r) => ({ ...r, note: r.note.slice(0, 500) })),
    },
    user: { ...user, collection: 'users', _strategy: 'local-jwt' },
    overrideAccess: false,
    context: { disableRevalidate: true },
  })
  const byCode = results.filter((r) => r.decidedBy === 'code').length
  say(`Recorded run ${run.id} for ${collection}/${meta.slug}: score ${run.score}, ${run.blockerCount} blockers; ${byCode} checks by code, ${results.length - byCode} by hand.`)
}

if (process.argv[1]?.endsWith('benchmark.ts')) {
  const commands: Record<string, (p: Payload) => Promise<void>> = { accuracy, worksheet, record }
  const run = commands[command ?? '']
  if (!run) {
    say('Commands: accuracy, worksheet, record. See the header of scripts/benchmark.ts.')
    process.exit(1)
  }
  const payload = await getPayload({ config })
  await run(payload)
  process.exit(0)
}
