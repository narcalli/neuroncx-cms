/**
 * Scores content against the frozen rubric (scripts/seed-rubric-v3.ts) and
 * records benchmark runs for the publish gate (src/lifecycle/benchmarkGate.ts).
 * Mechanical checks are decided in code (scripts/benchmark/mechanical.ts), the
 * judgement checks by Claude (scripts/benchmark/judge.ts, needs
 * ANTHROPIC_API_KEY). Runs count only once the scorer matches the hand scores
 * (scripts/benchmark/handScores.ts) within 5 points on every entry.
 *
 * Usage (from neuroncx-cms), with NODE_OPTIONS="--no-deprecation --import=tsx/esm":
 *
 *   node --env-file=.env scripts/benchmark.ts accuracy [--mechanical-only] [--from <cms url>]
 *     Scores the ten hand-scored entries as published on the live CMS and compares.
 *     Writes calibration/accuracy.json; a full pass is what lets runs be written.
 *     --mechanical-only skips Claude and compares only the checks code decides.
 *
 *   node --env-file=.env scripts/benchmark.ts score --collection <slug> [--slug <entry>] [--write --as <email>] [--remote]
 *     Scores the latest saved version of each entry in the database. With --write,
 *     records a benchmark run per entry as that user. Refuses to write unless the
 *     last accuracy check passed for this exact scorer and the Active rubric is v3.
 *     Runs only against a database on this machine unless --remote is given.
 *
 *   node --env-file=.env scripts/benchmark.ts layout [--from <cms url>]
 *     Writes one file per published entry to calibration/ (ignored through
 *     .git/info/exclude) to score by hand, as the calibrations were.
 */
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'
import { LIFECYCLE_SLUGS, type LifecycleCollection } from '../src/lifecycle/scope'
import { scoreResults, type ResultState } from '../src/lifecycle/score'
import { buildEntry, sectionsOf, str, type Doc, type Entry, type Refs } from './benchmark/entry'
import { HAND_SCORES_V3 } from './benchmark/handScores'
import { judge, fingerprintOf, MODEL } from './benchmark/judge'
import { decide, decideOrganisations, decideProductNames, type Verdict } from './benchmark/mechanical'
import { RUBRIC_V3 } from './seed-rubric-v3'

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
const ACCURACY_FILE = path.join(OUT, 'accuracy.json')
const TOLERANCE = 5
/** Bump when a mechanical check changes, so an old accuracy pass no longer counts. */
const MECHANICAL_VERSION = 1
const FINGERPRINT = fingerprintOf(
  RUBRIC_V3.map(({ itemId, criterion, passCondition }) => ({ itemId, criterion, passCondition })),
  MECHANICAL_VERSION,
)

export type Scored = Record<string, { state: ResultState | 'unknown'; note: string; by: 'code' | 'claude' | 'nobody' }>

/** One entry against rubric v3: code first, Claude for the rest (unless mechanicalOnly). */
export const scoreEntry = async (e: Entry, refs: Refs, mechanicalOnly: boolean): Promise<Scored> => {
  const severity = (id: string) => RUBRIC_V3.find((i) => i.itemId === id)!.severityIfFailed
  const stateOf = (id: string, v: Verdict): ResultState => (v === 'pass' ? 'pass' : v === 'na' ? 'na' : severity(id))
  const scored: Scored = {}
  const toJudge: string[] = []
  const hints: Record<string, string | undefined> = {}
  for (const item of RUBRIC_V3) {
    const d = decide(item.itemId, e, refs)
    if ('verdict' in d) scored[item.itemId] = { state: stateOf(item.itemId, d.verdict), note: d.note, by: 'code' }
    else {
      toJudge.push(item.itemId)
      hints[item.itemId] = d.hint
    }
  }
  // These two are decided by code from the names Claude finds, never by Claude alone.
  const byNames = ['hr-no-client-names', 'ex-product-claims-exist']
  const askClaude = toJudge.filter((id) => !byNames.includes(id))
  if (mechanicalOnly) {
    for (const id of toJudge) scored[id] = { state: 'unknown', note: 'Needs Claude.', by: 'nobody' }
    return scored
  }
  const result = await judge(
    e,
    refs,
    RUBRIC_V3.filter((i) => askClaude.includes(i.itemId)),
    hints,
  )
  for (const id of askClaude) scored[id] = { state: stateOf(id, result.checks[id].verdict), note: result.checks[id].reason, by: 'claude' }
  const orgs = decideOrganisations(result.organisations, e, refs)
  scored['hr-no-client-names'] = { state: stateOf('hr-no-client-names', orgs.verdict), note: orgs.note, by: 'claude' }
  const names = decideProductNames(result.neuronCxNames, e, refs)
  scored['ex-product-claims-exist'] = { state: stateOf('ex-product-claims-exist', names.verdict), note: names.note, by: 'claude' }
  return scored
}

const scoreOf = (scored: Scored) => scoreResults(Object.values(scored).filter((s) => s.state !== 'unknown').map((s) => ({ state: s.state as ResultState })))

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
  }
}

// ---------------------------------------------------------------- accuracy

const accuracy = async (payload: Payload) => {
  const mechanicalOnly = flag('--mechanical-only')
  if (!mechanicalOnly && !process.env.ANTHROPIC_API_KEY) {
    say('ANTHROPIC_API_KEY is not set. Run with --mechanical-only to check the code-decided checks alone.')
    process.exit(1)
  }
  const refs = await refsFrom(payload, (c) => livePublished(c, 0))
  const report: Record<string, unknown>[] = []
  let allWithin = true
  const disagreements: Record<string, number> = {}
  for (const hand of HAND_SCORES_V3) {
    const doc = (await livePublished(hand.collection)).find((d) => d.slug === hand.slug)
    if (!doc) {
      say(`${hand.collection}/${hand.slug}: not published any more; skipped.`)
      allWithin = false
      continue
    }
    const entry = await buildEntry(payload, hand.collection, doc)
    const scored = await scoreEntry(entry, refs, mechanicalOnly)
    const handScore = scoreResults(Object.values(hand.states).map((state) => ({ state }))).score ?? 0
    const differ = Object.entries(scored).filter(([id, s]) => s.state !== 'unknown' && s.state !== hand.states[id])
    for (const [id] of differ) disagreements[id] = (disagreements[id] ?? 0) + 1
    const decidedCount = Object.values(scored).filter((s) => s.state !== 'unknown').length
    let line: string
    if (mechanicalOnly) {
      // Unknown checks counted as passes for the top of the range, failures for the bottom.
      const states = Object.values(scored)
      const applicable = states.filter((s) => s.state !== 'na').length
      const passes = states.filter((s) => s.state === 'pass').length
      const unknown = states.filter((s) => s.state === 'unknown').length
      const low = Math.round((passes / applicable) * 1000) / 10
      const high = Math.round(((passes + unknown) / applicable) * 1000) / 10
      line = `${hand.collection}/${hand.slug}: hand ${handScore} | code decided ${decidedCount}/34, agrees on ${decidedCount - differ.length} | score could be ${low} to ${high}`
      report.push({ collection: hand.collection, slug: hand.slug, hand: handScore, decided: decidedCount, agrees: decidedCount - differ.length, low, high, differ: differ.map(([id, s]) => ({ id, scorer: s.state, hand: hand.states[id], note: s.note })) })
    } else {
      const score = scoreOf(scored).score ?? 0
      const within = Math.abs(score - handScore) <= TOLERANCE
      allWithin &&= within
      line = `${hand.collection}/${hand.slug}: hand ${handScore} | scorer ${score} | ${within ? 'within' : 'OUTSIDE'} ${TOLERANCE}`
      report.push({ collection: hand.collection, slug: hand.slug, hand: handScore, scorer: score, within, differ: differ.map(([id, s]) => ({ id, scorer: s.state, hand: hand.states[id], note: s.note })) })
    }
    say(line)
    for (const [id, s] of differ) say(`    ${id}: scorer ${s.state} (${s.by}), hand ${hand.states[id]}. ${s.note}`)
  }
  const passed = !mechanicalOnly && allWithin
  say('')
  say(Object.keys(disagreements).length ? `Disagreements by check: ${Object.entries(disagreements).map(([id, n]) => `${id} ${n}`).join(', ')}` : 'No disagreements.')
  say(mechanicalOnly ? 'Mechanical only: this cannot pass the accuracy check, which needs the judgement checks too.' : passed ? `PASSED: every entry within ${TOLERANCE} points.` : `FAILED: not every entry is within ${TOLERANCE} points. Runs will not be written.`)
  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(
    ACCURACY_FILE,
    JSON.stringify({ fingerprint: FINGERPRINT, model: MODEL, mode: mechanicalOnly ? 'mechanical-only' : 'full', passed, at: new Date().toISOString(), entries: report }, null, 1),
  )
  say(`Written to ${ACCURACY_FILE}`)
}

// ---------------------------------------------------------------- score

const score = async (payload: Payload) => {
  const collection = option('--collection') as LifecycleCollection | undefined
  if (!collection || !LIFECYCLE_SLUGS.includes(collection)) {
    say(`Name a collection with --collection: ${LIFECYCLE_SLUGS.join(', ')}.`)
    process.exit(1)
  }
  const write = flag('--write')
  const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
  if (!local && !flag('--remote')) {
    say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
    process.exit(1)
  }
  let asUser: Doc | undefined
  let rubric: { id: string; version?: number | null } | undefined
  if (write) {
    const accuracyCheck = fs.existsSync(ACCURACY_FILE) ? (JSON.parse(fs.readFileSync(ACCURACY_FILE, 'utf8')) as { fingerprint?: string; passed?: boolean; mode?: string }) : null
    if (!accuracyCheck?.passed || accuracyCheck.mode !== 'full' || accuracyCheck.fingerprint !== FINGERPRINT) {
      say('Refusing to write runs: the scorer has not passed the accuracy check against the hand scores (run "accuracy" first).')
      process.exit(1)
    }
    const email = option('--as')
    const users = email ? await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true }) : null
    asUser = users?.docs[0] as unknown as Doc | undefined
    if (!asUser) {
      say('Name the user the runs are recorded as with --as <email>.')
      process.exit(1)
    }
    const active = await payload.find({
      collection: 'rubrics',
      where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }] },
      draft: false,
      limit: 1,
      overrideAccess: true,
    })
    const r = active.docs[0]
    const same = r && JSON.stringify((r.items ?? []).map((i) => [i.itemId, i.passCondition])) === JSON.stringify(RUBRIC_V3.map((i) => [i.itemId, i.passCondition]))
    if (!r || !same) {
      say('Refusing to write runs: the Active rubric is not the frozen v3 the scorer was checked against.')
      process.exit(1)
    }
    rubric = { id: r.id, version: r.version }
  }
  const visitor = async (c: string) =>
    (await payload.find({ collection: c as LifecycleCollection, where: { _status: { equals: 'published' } }, draft: false, depth: 0, pagination: false, overrideAccess: false })).docs as unknown as Doc[]
  const refs = await refsFrom(payload, visitor)
  const slug = option('--slug')
  const entries = await payload.find({
    collection,
    where: slug ? { slug: { equals: slug } } : {},
    draft: true,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  for (const doc of entries.docs) {
    const latest = await payload.findVersions({ collection, where: { parent: { equals: doc.id } }, sort: '-updatedAt', limit: 1, depth: 1, overrideAccess: true })
    const version = latest.docs[0]
    if (!version) continue
    const entry = await buildEntry(payload, collection, version.version as unknown as Doc)
    const scored = await scoreEntry(entry, refs, false)
    const { score: s, blockerCount } = scoreOf(scored)
    say(`${collection}/${entry.slug}: ${s} (${blockerCount} blockers), version ${version.id}`)
    for (const [id, r] of Object.entries(scored)) if (r.state !== 'pass' && r.state !== 'na') say(`    ${id}: ${r.state}. ${r.note}`)
    if (write && asUser && rubric) {
      const run = await payload.create({
        collection: 'benchmarkRuns',
        data: {
          document: { relationTo: collection, value: String(doc.id) },
          versionId: String(version.id),
          rubric: rubric.id,
          rubricVersion: String(rubric.version),
          runAt: new Date().toISOString(),
          results: Object.entries(scored).map(([itemId, r]) => ({ itemId, state: r.state as ResultState, note: r.note.slice(0, 500) })),
        },
        user: { ...asUser, collection: 'users', _strategy: 'local-jwt' },
        overrideAccess: false,
        context: { disableRevalidate: true },
      })
      say(`    recorded run ${run.id}`)
    }
  }
}

// ---------------------------------------------------------------- layout

const layout = async (payload: Payload) => {
  fs.mkdirSync(OUT, { recursive: true })
  let n = 0
  for (const collection of LIFECYCLE_SLUGS) {
    for (const doc of await livePublished(collection)) {
      const e = await buildEntry(payload, collection, doc)
      const lines = [
        `# ${e.name} (${collection}/${e.slug})`,
        '',
        `Own page: ${e.ownPage ? 'yes' : 'no'} | images: ${e.images.map((i) => `${i.at} "${i.alt}"`).join('; ') || 'none'} | links: ${e.links.join('; ') || 'none'}`,
        '',
        ...sectionsOf(e).flatMap((s) => [`## ${s.heading}  [${s.key}]`, '', s.body, '']),
        '# Checklist (rubric v3)',
        '',
        ...RUBRIC_V3.flatMap((i) => [`## ${i.itemId} (${i.dimension}, ${i.severityIfFailed})`, `Pass when: ${i.passCondition}`, 'Result:', 'Reason:', '']),
      ]
      const file = path.join(OUT, `${String(++n).padStart(2, '0')}-${collection}-${e.slug}.md`)
      fs.writeFileSync(file, lines.join('\n'))
      say(path.basename(file))
    }
  }
}

if (process.argv[1]?.endsWith('benchmark.ts')) {
  const commands: Record<string, (p: Payload) => Promise<void>> = { accuracy, score, layout }
  const run = commands[command ?? '']
  if (!run) {
    say('Commands: accuracy, score, layout. See the header of scripts/benchmark.ts.')
    process.exit(1)
  }
  const payload = await getPayload({ config })
  await run(payload)
  process.exit(0)
}
