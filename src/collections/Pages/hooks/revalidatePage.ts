import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateFrontend } from '@/hooks/revalidateFrontend'

import type { Page } from '../../../payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      revalidateFrontend({
        logger: payload.logger,
        reason: `page published/updated at ${path}`,
      })
    }

    // If the page was previously published, revalidate the old path as well
    // (covers unpublish and slug changes)
    if (
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      revalidateFrontend({
        logger: payload.logger,
        reason: `page unpublished/slug-changed from ${oldPath}`,
      })
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`

    revalidateFrontend({
      logger: payload.logger,
      reason: `page deleted at ${path}`,
    })
  }

  return doc
}
