import type { CollectionConfig } from 'payload'

import { emailOnReviewRequest, reviewFields, stampReview } from './fields'
import { inReviewScope } from './scope'
import { refuseAuthorUnpublish } from './unpublish'

/**
 * The review workflow on Pages, Posts and the three content collections
 * (src/review/scope.ts): Ready for review and its note, who asked and when,
 * the email to content owners and admins, and Last edited by as a default
 * list column. While the workflow is on, authors see no Publish, Schedule or
 * Unpublish button (ReviewPublishButton, ReviewUnpublishButton); a publish from
 * an author is refused by the _status validator (src/fields/publishStatus.ts),
 * and an unpublish by refuseAuthorUnpublish (./unpublish.ts), scheduled ones
 * included, since they run as whoever scheduled them.
 */
const withReview = (config: CollectionConfig): CollectionConfig => {
  const hooks = config.hooks ?? {}
  const columns = config.admin?.defaultColumns
  const withEditor = columns?.length
    ? columns.includes('updatedBy')
      ? columns
      : columns.includes('updatedAt')
        ? columns.flatMap((c) => (c === 'updatedAt' ? ['updatedBy', c] : [c]))
        : [...columns, 'updatedBy']
    : columns
  return {
    ...config,
    fields: [...config.fields, ...reviewFields()],
    hooks: {
      ...hooks,
      beforeOperation: [refuseAuthorUnpublish, ...(hooks.beforeOperation ?? [])],
      beforeChange: [...(hooks.beforeChange ?? []), stampReview],
      afterChange: [...(hooks.afterChange ?? []), emailOnReviewRequest],
    },
    admin: {
      ...config.admin,
      defaultColumns: withEditor,
      components: {
        ...config.admin?.components,
        edit: {
          ...config.admin?.components?.edit,
          PublishButton: '@/review/ReviewPublishButton#ReviewPublishButton',
          UnpublishButton: '@/review/ReviewUnpublishButton#ReviewUnpublishButton',
        },
      },
    },
  }
}

/** withReview on the collections the workflow covers; the rest are left as they are. */
export const applyReview = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => (inReviewScope(c.slug) ? withReview(c) : c))
