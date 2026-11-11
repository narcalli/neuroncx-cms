import { PublishButton } from '@payloadcms/ui'
import type { PublishButtonServerProps } from 'payload'
import React from 'react'

import { canPublish } from './scope'

/**
 * The Publish button, which also offers Schedule publish. While the review
 * workflow is on, an author sees a note in its place instead, so they can
 * neither publish nor schedule a publish from the admin. A publish sent
 * another way is refused by the _status validator (src/fields/publishStatus.ts),
 * and so is a scheduled one when it runs, since it runs as whoever scheduled it.
 */
export async function ReviewPublishButton({ payload, user }: PublishButtonServerProps) {
  if (user && !canPublish(user as never)) {
    const standards = await payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true }).catch(() => null)
    if ((standards as { reviewRequired?: boolean } | null)?.reviewRequired) {
      return (
        <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)', alignSelf: 'center' }}>
          Publishing needs a content owner or admin. Tick Ready for review and save.
        </span>
      )
    }
  }
  return <PublishButton />
}
