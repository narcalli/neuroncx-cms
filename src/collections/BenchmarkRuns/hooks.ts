import type { CollectionBeforeChangeHook } from 'payload'
import { APIError, ValidationError } from 'payload'

import type { BenchmarkRun } from '@/payload-types'
import { contentHash } from '@/lifecycle/contentHash'
import { LIFECYCLE_COLLECTIONS } from '@/lifecycle/scope'
import { scoreResults } from '@/lifecycle/score'

/**
 * A run records what was scored, so it never changes once made: a new score
 * is a new run. Holds even with overrideAccess, which skips update access.
 */
export const refuseRunEdits: CollectionBeforeChangeHook<BenchmarkRun> = ({ data, operation }) => {
  if (operation === 'update') {
    throw new APIError('Benchmark runs cannot be changed. Record a new run instead.', 403)
  }
  return data
}

// An id that cannot be one (a malformed value) is simply not found. A
// database error is not the run's fault, so it is passed on as it is rather
// than reported as a missing version.
const notFoundOnBadId = (err: unknown): null => {
  if (err instanceof Error && /Cast|BSON/.test(err.name)) return null
  throw err
}

/**
 * versionId must be a saved version of the scored document itself. Sets
 * contentHash from that version, so the gate can match the run to content
 * about to be published, which has no version id yet.
 */
export const checkScoredVersion: CollectionBeforeChangeHook<BenchmarkRun> = async ({ data, req }) => {
  const doc = data.document
  if (!doc?.relationTo || !doc.value || !data.versionId) return data
  const parent = typeof doc.value === 'object' ? doc.value.id : doc.value
  const found = await req.payload
    .findVersions({
      collection: doc.relationTo,
      where: { and: [{ id: { equals: data.versionId } }, { parent: { equals: parent } }] },
      limit: 1,
      // One query: with pagination a count runs alongside the find, and MongoDB
      // refuses two operations at once in the save's transaction.
      pagination: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(notFoundOnBadId)
  const version = found?.docs[0]?.version
  if (version) {
    data.contentHash = contentHash(version)
    return data
  }
  throw new ValidationError({
    collection: 'benchmarkRuns',
    errors: [
      {
        path: 'versionId',
        message: 'This is not a saved version of the chosen document. Send the ID of the exact version that was scored.',
      },
    ],
  })
}

/**
 * rubricVersion must name a published version of the chosen rubric, and every
 * result must be for an item in that version, so a run never refers to
 * criteria that were not in the rubric it claims. A run where every result is
 * Not applicable is refused too: no item applying to a content type means the
 * rubric's Applies to is wrong for it, and that should surface here rather
 * than as a failed score.
 */
export const checkRubricItems: CollectionBeforeChangeHook<BenchmarkRun> = async ({ data, req }) => {
  const rubric = typeof data.rubric === 'object' ? data.rubric?.id : data.rubric
  const number = Number(data.rubricVersion)
  if (!rubric || !data.rubricVersion) return data
  const published = Number.isInteger(number)
    ? await req.payload
        .findVersions({
          collection: 'rubrics',
          where: {
            and: [
              { parent: { equals: rubric } },
              { 'version.version': { equals: number } },
              { 'version._status': { equals: 'published' } },
            ],
          },
          sort: '-updatedAt',
          limit: 1,
          pagination: false,
          depth: 0,
          overrideAccess: true,
          req,
        })
        .catch(notFoundOnBadId)
    : null
  const version = published?.docs[0]?.version
  if (!version) {
    throw new ValidationError({
      collection: 'benchmarkRuns',
      errors: [
        {
          path: 'rubricVersion',
          message: `The rubric has no published version ${data.rubricVersion}. Send the version number the content was scored against.`,
        },
      ],
    })
  }
  const items = new Set((version.items ?? []).map((i) => i.itemId))
  const results = Array.isArray(data.results) ? data.results : []
  const unknown = [...new Set(results.map((r) => r?.itemId).filter((id) => id && !items.has(id)))]
  if (unknown.length) {
    throw new ValidationError({
      collection: 'benchmarkRuns',
      errors: [
        {
          path: 'results',
          message: `Not items in version ${data.rubricVersion} of the rubric: ${unknown.join(', ')}.`,
        },
      ],
    })
  }
  if (results.length && results.every((r) => r?.state === 'na')) {
    const type = LIFECYCLE_COLLECTIONS.find((c) => c.value === data.document?.relationTo)?.label
    throw new ValidationError({
      collection: 'benchmarkRuns',
      errors: [
        {
          path: 'results',
          message: `Every result is Not applicable, so no item in version ${data.rubricVersion} of "${version.name}" applies to ${type ?? data.document?.relationTo}. Check Applies to on the rubric's items.`,
        },
      ],
    })
  }
  return data
}

/**
 * score and blockerCount from the results (src/lifecycle/score.ts), never from
 * the request. No verdict is stored: see verdictFor (src/lifecycle/verdict.ts).
 */
export const scoreRun: CollectionBeforeChangeHook<BenchmarkRun> = ({ data }) => {
  const { score, blockerCount } = scoreResults(Array.isArray(data.results) ? data.results : [])
  data.score = score
  data.blockerCount = blockerCount
  return data
}

/** runBy: the user who recorded the run, or the owner of the API key used. */
export const stampRunner: CollectionBeforeChangeHook<BenchmarkRun> = ({ data, req }) => {
  data.runBy = req.user?.collection === 'users' ? req.user.id : null
  return data
}
