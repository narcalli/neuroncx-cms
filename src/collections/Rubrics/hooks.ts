import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import type { Rubric } from '@/payload-types'

// Payload keeps the published record apart from later drafts, so this is the
// rubric as last published (or as first saved, before any publish).
const storedRubric = async (req: PayloadRequest, id: string): Promise<Rubric | null> =>
  req.payload
    .findByID({ collection: 'rubrics', id, draft: false, depth: 0, overrideAccess: true, req })
    .catch(() => null)

/**
 * version goes up by one on each publish; a draft carries the version last
 * published. Always set here: the field takes nothing from the request.
 */
export const numberRubricVersion: CollectionBeforeChangeHook<Rubric> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const stored = operation === 'update' && originalDoc?.id ? await storedRubric(req, originalDoc.id) : null
  const last = stored?.version ?? 0
  data.version = data._status === 'published' ? last + 1 : stored?.version ?? null
  return data
}

/**
 * Only one rubric may be Active: the one content is scored against. Checked
 * on publish, against published rubrics, so the next rubric can be drafted
 * while the current one is still Active.
 */
export const checkOneActiveRubric: CollectionBeforeChangeHook<Rubric> = async ({
  data,
  originalDoc,
  req,
}) => {
  const status = data.status ?? originalDoc?.status
  if (data._status !== 'published' || status !== 'active') return data
  const others = await req.payload.find({
    collection: 'rubrics',
    where: {
      and: [
        { status: { equals: 'active' } },
        { _status: { equals: 'published' } },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
    draft: false,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })
  const active = others.docs[0]
  if (!active) return data
  throw new ValidationError({
    collection: 'rubrics',
    errors: [
      {
        path: 'status',
        message: `Only one rubric can be Active, and "${active.name}" is. Set it to Retired and publish it first.`,
      },
    ],
  })
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
