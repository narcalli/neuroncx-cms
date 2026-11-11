import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Field, FieldAccess } from 'payload'

import { notifyReviewers } from './notify'
import { reviewWorkflowOn } from './scope'

/** Visitors never see a review request. */
const signedIn: FieldAccess = ({ req }) => Boolean(req.user)

export const REVIEW_FIELD_NAMES = ['readyForReview', 'reviewNote', 'reviewRequestedBy', 'reviewRequestedAt'] as const

/**
 * Ready for review and its note, in the sidebar. Who asked and when are set by
 * stampReview, never by hand. All four clear when the entry is published.
 */
export const reviewFields = (): Field[] => [
  {
    name: 'readyForReview',
    type: 'checkbox',
    label: 'Ready for review',
    defaultValue: false,
    access: { read: signedIn },
    admin: {
      position: 'sidebar',
      description:
        'Asks a content owner or admin to review and publish this entry. They are emailed when this is ticked and saved, while the review workflow is on. Cleared on publish.',
    },
  },
  {
    name: 'reviewNote',
    type: 'textarea',
    label: 'Note for the reviewer (optional)',
    maxLength: 300,
    access: { read: signedIn },
    admin: {
      position: 'sidebar',
      condition: (_data, siblingData) => Boolean(siblingData?.readyForReview),
      description: 'What changed and what to check. Sent in the email and shown in the review queue.',
    },
  },
  {
    name: 'reviewRequestedBy',
    type: 'relationship',
    relationTo: 'users',
    access: { read: signedIn, create: () => false, update: () => false },
    admin: { hidden: true },
  },
  {
    name: 'reviewRequestedAt',
    type: 'date',
    access: { read: signedIn, create: () => false, update: () => false },
    admin: { hidden: true },
  },
]

type Doc = Record<string, unknown>

/**
 * beforeChange: who asked for review and when, set as the box is ticked; all
 * cleared when the entry is published, or when the box is unticked.
 */
export const stampReview: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (data._status === 'published' || data.readyForReview === false) {
    data.readyForReview = false
    data.reviewNote = null
    data.reviewRequestedBy = null
    data.reviewRequestedAt = null
    return data
  }
  const was = Boolean((originalDoc as Doc | undefined)?.readyForReview)
  if (data.readyForReview && !was) {
    const user = req.user as { id?: unknown; collection?: string } | null
    data.reviewRequestedBy = user?.id && user.collection === 'users' ? String(user.id) : null
    data.reviewRequestedAt = new Date().toISOString()
  } else {
    // Kept as they were: the hidden fields are not sent by the form.
    data.reviewRequestedBy = (originalDoc as Doc | undefined)?.reviewRequestedBy ?? null
    data.reviewRequestedAt = (originalDoc as Doc | undefined)?.reviewRequestedAt ?? null
  }
  return data
}

/** afterChange: content owners and admins are emailed as the box turns ticked. */
export const emailOnReviewRequest: CollectionAfterChangeHook = async ({ collection, doc, previousDoc, req }) => {
  if (!doc?.readyForReview || previousDoc?.readyForReview) return doc
  try {
    if (!(await reviewWorkflowOn(req))) return doc
    await notifyReviewers({ req, collection, doc })
  } catch (err) {
    req.payload.logger.error(`Review request for ${collection.slug} ${doc.id} saved, but the email failed: ${String(err)}`)
  }
  return doc
}
