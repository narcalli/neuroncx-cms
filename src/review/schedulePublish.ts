import type { PayloadRequest, ServerFunction } from 'payload'
import { schedulePublishHandler } from '@payloadcms/ui/utilities/schedulePublishHandler'

import { isApiKeyRequest } from '@/access/apiKeyRequest'

import { canPublish, inReviewScope, reviewWorkflowOn } from './scope'

export const KEY_SCHEDULE_MESSAGE = 'An API key cannot schedule a publish or unpublish, or cancel one.'
export const AUTHOR_SCHEDULE_MESSAGE = 'Scheduling a publish or unpublish needs a content owner or admin while the review workflow is on.'
export const CANCEL_SCHEDULE_MESSAGE = 'Only the person who scheduled it, or a content owner or admin, can cancel a scheduled publish.'

type Args = {
  deleteID?: number | string
  doc?: { relationTo?: string; value?: number | string }
  req: PayloadRequest
}

/**
 * Payload's Schedule publish server function (@payloadcms/ui, payload 3.84.1)
 * only checks that someone is signed in, then queues the job with full access.
 * The job runs as that user, reloaded from the database, so a key's limits
 * are gone by the time it runs, and its deleteID cancels any job. This checks
 * first: never a key; while the review workflow is on, only someone who may
 * publish schedules on a collection it covers; and only the person who made a
 * schedule, or someone who may publish, cancels it. Registered in
 * src/app/(payload)/layout.tsx.
 */
export const schedulePublish: ServerFunction<Args> = async (args) => {
  const { deleteID, doc, req } = args
  const user = req.user
  if (!user || isApiKeyRequest(req)) return { error: KEY_SCHEDULE_MESSAGE }
  const publisher = canPublish(user)
  if (!publisher && doc?.relationTo && inReviewScope(doc.relationTo) && (await reviewWorkflowOn(req))) {
    return { error: AUTHOR_SCHEDULE_MESSAGE }
  }
  if (deleteID != null && !publisher) {
    const job = (await req.payload
      .findByID({ collection: 'payload-jobs', id: deleteID, depth: 0, overrideAccess: true, req })
      .catch(() => null)) as { taskSlug?: string; input?: { user?: unknown } } | null
    const scheduler = job?.input?.user
    const ownId = typeof scheduler === 'object' && scheduler ? (scheduler as { value?: unknown }).value : scheduler
    if (job?.taskSlug !== 'schedulePublish' || String(ownId) !== String(user.id)) return { error: CANCEL_SCHEDULE_MESSAGE }
  }
  return schedulePublishHandler(args as never)
}
