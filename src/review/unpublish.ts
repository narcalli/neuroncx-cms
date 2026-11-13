import type { CollectionBeforeOperationHook, PayloadRequest, Where } from 'payload'

import { canPublish, inReviewScope, reviewWorkflowOn } from './scope'
import { publicError } from '@/utilities/publicError'

export const REVIEW_UNPUBLISH_MESSAGE =
  'Unpublishing needs a content owner or admin. Ask one to unpublish it, or tick Ready for review with a note saying it should come down.'

export const REVIEW_DELETE_MESSAGE =
  'Deleting a live entry needs a content owner or admin, as it takes the entry off the site. Ask one to delete it, or tick Ready for review with a note saying it should come down.'

type TargetArgs = { data?: { _status?: string }; draft?: boolean | string; id?: string | number; where?: Where }

/** Whether an update is an unpublish: not a draft save, and it sets the status to draft. */
export const isUnpublish = (args: TargetArgs): boolean => !(args.draft === true || args.draft === 'true') && args.data?._status === 'draft'

/** Whether the entries an update or delete targets (one by id, or a list by where) include a live one. */
export const targetsLiveEntry = async (req: PayloadRequest, slug: string, args: TargetArgs): Promise<boolean> => {
  const target: Where | undefined = args.id != null ? { id: { equals: args.id } } : args.where
  const live = await req.payload.count({
    collection: slug as never,
    where: { and: [...(target ? [target] : []), { _status: { equals: 'published' } }] },
    overrideAccess: true,
    req,
  })
  return live.totalDocs > 0
}

/**
 * beforeOperation: while the review workflow is on, an author cannot
 * unpublish an entry it covers, one at a time or from a list, nor delete one
 * that is live, which takes it off the site just the same. An unpublish is an
 * update that is not a draft save, sets the status to draft, and lands on an
 * entry that is live now. The _status validator does not refuse a change to
 * draft, so this does, before anything is written.
 */
export const refuseAuthorUnpublish: CollectionBeforeOperationHook = async ({ args, collection, operation, req }) => {
  if (operation !== 'update' && operation !== 'delete') return args
  const a = args as TargetArgs
  if (operation === 'update' && !isUnpublish(a)) return args
  if (!req.user || canPublish(req.user) || !inReviewScope(collection.slug)) return args
  if (!(await reviewWorkflowOn(req))) return args
  if (await targetsLiveEntry(req, collection.slug, a)) {
    throw publicError(operation === 'delete' ? REVIEW_DELETE_MESSAGE : REVIEW_UNPUBLISH_MESSAGE, 403)
  }
  return args
}
