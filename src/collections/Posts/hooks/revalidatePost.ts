import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateFrontend } from '@/hooks/revalidateFrontend'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      revalidateFrontend({
        logger: payload.logger,
        reason: `post published/updated at ${path}`,
      })
    }

    // If the post was previously published, revalidate the old path as well
    // (covers unpublish and slug changes)
    if (
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPath = `/posts/${previousDoc.slug}`

      revalidateFrontend({
        logger: payload.logger,
        reason: `post unpublished/slug-changed from ${oldPath}`,
      })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidateFrontend({
      logger: payload.logger,
      reason: `post deleted at ${path}`,
    })
  }

  return doc
}
