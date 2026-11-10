import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import type { Rubric } from '@/payload-types'

// Payload keeps the published record apart from later drafts, so this is the
// rubric as last published (or as first saved, before any publish).
const storedRubric = async (req: PayloadRequest, id: string): Promise<Rubric | null> =>
  req.payload
    .findByID({ collection: 'rubrics', id, draft: false, depth: 0, overrideAccess: true, req })
    .catch(() => null)

// The checks themselves, ignoring row ids and order: what a version number stands for.
const checksOf = (items: Rubric['items'] | undefined): string =>
  JSON.stringify(
    (items ?? [])
      .map(({ itemId, dimension, criterion, passCondition, severityIfFailed, appliesTo }) => ({
        itemId,
        dimension,
        criterion,
        passCondition,
        severityIfFailed,
        appliesTo: [...(appliesTo ?? [])].sort(),
      }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId)),
  )

/**
 * version means the checks changed: 1 on the first publish, then up by one
 * only when a publish changes the items (one added or removed, or any of an
 * item's fields). Renaming, retiring or republishing keeps the number, so a
 * swap of Active rubrics does not renumber the old one. A draft carries the
 * version last published. Always set here: the field takes nothing from the
 * request.
 */
export const numberRubricVersion: CollectionBeforeChangeHook<Rubric> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const stored = operation === 'update' && originalDoc?.id ? await storedRubric(req, originalDoc.id) : null
  if (data._status !== 'published') {
    data.version = stored?.version ?? null
  } else if (!stored?.version) {
    data.version = 1
  } else {
    const items = data.items ?? originalDoc?.items
    data.version = checksOf(items) === checksOf(stored.items) ? stored.version : stored.version + 1
  }
  return data
}

// Published rubrics marked Active, other than this one: at most one, unless
// an older save left two.
const otherActiveRubrics = async (req: PayloadRequest, id?: string): Promise<Rubric[]> =>
  (
    await req.payload.find({
      collection: 'rubrics',
      where: {
        and: [
          { status: { equals: 'active' } },
          { _status: { equals: 'published' } },
          ...(id ? [{ id: { not_equals: id } }] : []),
        ],
      },
      draft: false,
      depth: 0,
      pagination: false,
      sort: '-updatedAt',
      overrideAccess: true,
      req,
    })
  ).docs

/**
 * Publishing a rubric as Active supersedes the one that was Active: noted here
 * in supersedes, and retired by retireSupersededRubrics once this save has
 * gone through, so there is never a moment with no Active rubric. A draft can
 * be Active without superseding anything until it is published.
 */
export const noteSupersededRubric: CollectionBeforeChangeHook<Rubric> = async ({
  data,
  originalDoc,
  req,
}) => {
  const status = data.status ?? originalDoc?.status
  // supersedes takes nothing from the request: keep what this rubric already records.
  data.supersedes = originalDoc?.supersedes ?? null
  if (data._status !== 'published' || status !== 'active') return data
  const previous = (await otherActiveRubrics(req, originalDoc?.id))[0]
  if (previous) data.supersedes = previous.id
  return data
}

/**
 * Retires every other Active rubric after one is published as Active, in the
 * same request (and so the same transaction, where the database has them).
 * Each is republished from its published version with status Retired, so a
 * draft someone has open on it is not published along the way; the draft stays
 * in its History.
 */
export const retireSupersededRubrics: CollectionAfterChangeHook<Rubric> = async ({ doc, req }) => {
  if (doc._status !== 'published' || doc.status !== 'active') return doc
  for (const old of await otherActiveRubrics(req, doc.id)) {
    await req.payload.update({
      collection: 'rubrics',
      id: old.id,
      data: { name: old.name, items: old.items, status: 'retired', _status: 'published' },
      overrideAccess: true,
      req,
    })
  }
  return doc
}

/**
 * An item code, once published and then removed, is retired for good: benchmark
 * runs already refer to it, so it must not come back for another criterion.
 * Removing an item in a draft retires nothing until that draft is published.
 */
export const keepItemIdsRetired: CollectionBeforeChangeHook<Rubric> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!originalDoc?.id) return data
  const published = await req.payload.findVersions({
    collection: 'rubrics',
    where: {
      and: [{ parent: { equals: originalDoc.id } }, { 'version._status': { equals: 'published' } }],
    },
    sort: '-updatedAt',
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (!published.docs.length) return data
  const idsOf = (r: Pick<Rubric, 'items'>) => (r.items ?? []).map((i) => i.itemId)
  const live = new Set(idsOf(published.docs[0].version))
  const retired = new Set(published.docs.flatMap((v) => idsOf(v.version)).filter((id) => !live.has(id)))
  const reused = idsOf({ items: data.items ?? originalDoc.items }).filter((id) => retired.has(id))
  if (!reused.length) return data
  throw new ValidationError({
    collection: 'rubrics',
    errors: [
      {
        path: 'items',
        message: `Item ${reused.join(', ')} was removed from an earlier published version and cannot be used again. Give the item a new ID.`,
      },
    ],
  })
}
