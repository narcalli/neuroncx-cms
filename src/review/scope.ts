import type { PayloadRequest } from 'payload'

import { hasRole } from '@/access/roles'

/**
 * The review workflow: authors mark an entry Ready for review and a content
 * owner or admin publishes it. Off until an admin turns on "Authors need
 * review to publish" in Content standards; while off, nothing here refuses
 * or emails anything.
 */
export const REVIEW_SLUGS = ['pages', 'posts', 'sectors', 'industryTopics', 'microApps'] as const
export type ReviewCollection = (typeof REVIEW_SLUGS)[number]

export const inReviewScope = (slug: string | undefined | null): slug is ReviewCollection =>
  Boolean(slug && (REVIEW_SLUGS as readonly string[]).includes(slug))

/** Who may publish while the workflow is on. */
export const canPublish = (user: PayloadRequest['user'] | { role?: string | null } | null | undefined): boolean =>
  hasRole(user as PayloadRequest['user'], 'admin', 'contentOwner')

const CACHE_KEY = 'reviewWorkflowOn'

/**
 * Whether the workflow is on (Content standards), read once per request. A
 * failed read counts as on and is not remembered: an author's publish is
 * refused rather than let through because the switch could not be read.
 */
export const reviewWorkflowOn = async (req: PayloadRequest): Promise<boolean> => {
  if (typeof req.context?.[CACHE_KEY] === 'boolean') return req.context[CACHE_KEY] as boolean
  let on: boolean
  try {
    const standards = await req.payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true, req })
    on = Boolean((standards as { reviewRequired?: boolean } | null)?.reviewRequired)
  } catch (err) {
    req.payload.logger.error(`Could not read the review switch, so it counts as on: ${String(err)}`)
    return true
  }
  if (req.context) req.context[CACHE_KEY] = on
  return on
}

export const REVIEW_PUBLISH_MESSAGE =
  'Publishing needs a content owner or admin. Tick Ready for review, add a note for the reviewer and save: content owners and admins are emailed.'
