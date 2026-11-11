import { UnpublishButton } from '@payloadcms/ui'
import type { UnpublishButtonServerProps } from 'payload'
import React from 'react'

import { canPublish } from './scope'

/**
 * The Unpublish button, hidden from an author while the review workflow is
 * on. An unpublish sent another way is refused by refuseAuthorUnpublish
 * (src/review/unpublish.ts).
 */
export async function ReviewUnpublishButton({ payload, user }: UnpublishButtonServerProps) {
  if (user && !canPublish(user as never)) {
    const standards = await payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true }).catch(() => null)
    if ((standards as { reviewRequired?: boolean } | null)?.reviewRequired) return null
  }
  return <UnpublishButton />
}
