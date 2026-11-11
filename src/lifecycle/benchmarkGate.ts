import type { CollectionAfterChangeHook, CollectionSlug, Endpoint, PayloadRequest } from 'payload'

import { CONTENT_EVENTS, type EventAction } from '@/history/ContentEvents'

import { contentHash } from './contentHash'
import { gateFor } from './gate'
import { LIFECYCLE_SLUGS, type LifecycleCollection } from './scope'
import { verdictFor } from './verdict'

/**
 * The publish gate (contentPublishCheck, src/content/fallbacks.ts). For now it
 * only warns: it never stops a publish, and records each one as passed, failed
 * or not scored in History. Enforcing comes later, with scheduled publishes
 * failing their job, reverting to draft and telling the owner.
 */
export const GATE_MODE = 'warn' as const

export type GateState = 'pass' | 'fail' | 'notScored'

export type GateResult = {
  state: GateState
  reason: string
  contentHash: string
  /** A content owner's override recorded for this exact content. Not applied while the gate only warns. */
  overridden: boolean
  score?: number | null
  gate?: number
  blockerCount?: number
  runId?: string
  rubricName?: string
  rubricVersion?: string
}

export const isLifecycleCollection = (slug: string): slug is LifecycleCollection =>
  (LIFECYCLE_SLUGS as string[]).includes(slug)

const activeRubric = async (req: PayloadRequest) =>
  (
    await req.payload.find({
      collection: 'rubrics',
      where: { and: [{ status: { equals: 'active' } }, { _status: { equals: 'published' } }] },
      draft: false,
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      overrideAccess: true,
      req,
    })
  ).docs[0]

/**
 * Where this content stands against the gate: the latest benchmark run for
 * exactly this content (by content hash) against the Active rubric's current
 * version, judged against the collection's gate in Content standards.
 */
export const checkBenchmark = async (
  req: PayloadRequest,
  collection: LifecycleCollection,
  docId: string | undefined,
  content: Record<string, unknown>,
): Promise<GateResult> => {
  const hash = contentHash(content)
  const overridden = Boolean(content.gateOverride) && content.gateOverrideHash === hash
  const base = { contentHash: hash, overridden }

  const rubric = await activeRubric(req)
  if (!rubric?.version) {
    return { ...base, state: 'notScored', reason: 'Not scored: no rubric is published as Active yet.' }
  }
  const rubricVersion = String(rubric.version)
  const named = { rubricName: rubric.name, rubricVersion }
  if (!docId) {
    return { ...base, ...named, state: 'notScored', reason: 'Not scored: the entry had not been saved before.' }
  }

  const runs = await req.payload.find({
    collection: 'benchmarkRuns',
    where: {
      and: [
        { 'document.relationTo': { equals: collection } },
        { 'document.value': { equals: docId } },
        { contentHash: { equals: hash } },
        { rubric: { equals: rubric.id } },
        { rubricVersion: { equals: rubricVersion } },
      ],
    },
    sort: '-runAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const run = runs.docs[0]
  if (!run) {
    return {
      ...base,
      ...named,
      state: 'notScored',
      reason: `Not scored: no benchmark run for this exact content against "${rubric.name}" version ${rubricVersion}.`,
    }
  }

  const standards = await req.payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true, req })
  const gate = gateFor(standards, collection)
  const state = verdictFor(run, gate)
  const blockers = run.blockerCount ?? 0
  const reason =
    blockers > 0
      ? `Fails: ${blockers} blocker${blockers === 1 ? '' : 's'}, whatever the score (${run.score ?? 'no score'}, gate ${gate}).`
      : state === 'pass'
        ? `Passes: scored ${run.score} against a gate of ${gate}.`
        : `Below the gate: scored ${run.score ?? 'nothing'} against a gate of ${gate}.`
  return { ...base, ...named, state, reason, score: run.score, gate, blockerCount: blockers, runId: String(run.id) }
}

// Notes from beforeChange to afterChange, where the saved document's id and version are known.
const GATE_NOTES = 'benchmarkGate'
const noteKey = (slug: string, id: unknown) => `${slug}:${id ?? 'new'}`
type Notes = Record<string, GateResult>

/**
 * Called by contentPublishCheck on a publish. Never throws: a failed check is
 * recorded as not scored. Saves with nobody signed in (scheduled publishes,
 * jobs, scripts) are left alone while the gate only warns.
 */
export const noteBenchmarkGate = async (
  slug: string,
  content: Record<string, unknown>,
  docId: unknown,
  req: PayloadRequest,
): Promise<void> => {
  if (!isLifecycleCollection(slug) || !req.user) return
  let result: GateResult
  try {
    result = await checkBenchmark(req, slug, docId == null ? undefined : String(docId), content)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    req.payload.logger.warn(`Benchmark gate check failed for ${slug} ${String(docId)}: ${message}`)
    result = { state: 'notScored', reason: `Not scored: the benchmark check failed (${message}).`, contentHash: '', overridden: false }
  }
  const notes = ((req.context[GATE_NOTES] as Notes | undefined) ??= {})
  notes[noteKey(slug, docId)] = result
}

const ACTION: Record<GateState, EventAction> = {
  pass: 'benchmarkPassed',
  fail: 'benchmarkFailed',
  notScored: 'notScored',
}

const latestVersionId = async (req: PayloadRequest, slug: string, id: string) => {
  const latest = await req.payload.db.findVersions({
    collection: slug as CollectionSlug,
    where: { parent: { equals: id } },
    sort: '-updatedAt',
    limit: 1,
    pagination: false,
    req,
  })
  return latest.docs[0]?.id ? String(latest.docs[0].id) : null
}

/** A History event (contentEvents), written with the save it belongs to. */
export const writeContentEvent = async (
  req: PayloadRequest,
  slug: string,
  docId: string,
  action: EventAction,
  note: string,
) => {
  await req.payload.create({
    collection: CONTENT_EVENTS as CollectionSlug,
    data: {
      collectionSlug: slug,
      doc: docId,
      action,
      user: req.user?.collection === 'users' ? req.user.id : null,
      version: await latestVersionId(req, slug, docId),
      note,
    },
    overrideAccess: true,
    req,
  })
}

/** afterChange: records the gate's verdict on a publish in History. */
export const logBenchmarkGate: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  const notes = req.context[GATE_NOTES] as Notes | undefined
  if (!notes) return doc
  const key = [noteKey(collection.slug, doc.id), noteKey(collection.slug, undefined)].find((k) => k in notes)
  if (!key) return doc
  const result = notes[key]
  delete notes[key]
  if (doc._status !== 'published') return doc
  const override = result.overridden
    ? ' A content owner override is recorded for this content; it is not applied while the gate only warns.'
    : ''
  try {
    await writeContentEvent(req, collection.slug, String(doc.id), ACTION[result.state], `${result.reason}${override}`)
  } catch (err) {
    req.payload.logger.warn(`Could not record the benchmark gate for ${collection.slug} ${doc.id}: ${String(err)}`)
  }
  return doc
}

/**
 * GET /api/<collection>/:id/benchmark-status: the gate's view of the entry's
 * last saved version, for the sidebar indicator (src/lifecycle/BenchmarkStatus.tsx).
 */
export const benchmarkStatusEndpoint = (slug: LifecycleCollection): Endpoint => ({
  path: '/:id/benchmark-status',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Sign in first.' }, { status: 401 })
    const id = String(req.routeParams?.id ?? '')
    const latest = await req.payload.findVersions({
      collection: slug,
      where: { parent: { equals: id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: false,
      req,
    })
    const version = latest.docs[0]
    if (!version) return Response.json({ error: 'No saved version yet.' }, { status: 404 })
    const result = await checkBenchmark(req, slug, id, version.version as unknown as Record<string, unknown>)
    return Response.json({ ...result, mode: GATE_MODE, versionId: String(version.id) })
  },
})
