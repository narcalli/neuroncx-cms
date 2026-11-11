import type { CollectionBeforeOperationHook, Where } from 'payload'
import { APIError } from 'payload'

import { canPublish, inReviewScope, reviewWorkflowOn } from './scope'

export const REVIEW_UNPUBLISH_MESSAGE =
  'Unpublishing needs a content owner or admin. Ask one to unpublish it, or tick Ready for review with a note saying it should come down.'

type UpdateArgs = { data?: { _status?: string }; draft?: boolean | string; id?: string | number; where?: Where }

/**
 * beforeOperation: while the review workflow is on, an author cannot
 * unpublish an entry it covers, one at a time or from a list. An unpublish is
 * an update that is not a draft save, sets the status to draft, and lands on
 * an entry that is live now. Payload skips field validation for it, so the
 * _status validator cannot catch it; this does, before anything is written.
 */
export const refuseAuthorUnpublish: CollectionBeforeOperationHook = async ({ args, collection, operation, req }) => {
  if (operation !== 'update') return args
  const a = args as UpdateArgs
  const draftSave = a.draft === true || a.draft === 'true'
  if (draftSave || a.data?._status !== 'draft' || !req.user || canPublish(req.user) || !inReviewScope(collection.slug)) return args
  if (!(await reviewWorkflowOn(req))) return args
  const target: Where | undefined = a.id != null ? { id: { equals: a.id } } : a.where
  const live = await req.payload.count({
    collection: collection.slug as never,
    where: { and: [...(target ? [target] : []), { _status: { equals: 'published' } }] },
    overrideAccess: true,
    req,
  })
  if (live.totalDocs > 0) throw new APIError(REVIEW_UNPUBLISH_MESSAGE, 403, null, true)
  return args
}
