import type { CollectionConfig, EditConfigWithoutRoot } from 'payload'

import { rollbackCheckEndpoint } from './check'
import { historyFields } from './fields'
import { draftRollbackOnly, logContentEvent, stampEditor } from './hooks'

export { ContentEvents } from './ContentEvents'

const hasDrafts = (c: CollectionConfig): boolean =>
  typeof c.versions === 'object' && Boolean(c.versions?.drafts)

/**
 * History for one collection with drafts: who saved each version, what
 * changed, publish, unpublish and rollback events, and rollback to a draft
 * from the History tab (in place of Payload's Versions tab). Every version is
 * kept: Payload's pruning ignores whether a version was ever live.
 */
export const withHistory = (config: CollectionConfig): CollectionConfig => {
  const hooks = config.hooks ?? {}
  const views = config.admin?.components?.views ?? {}
  const edit = {
    ...views.edit,
    versions: { Component: '@/history/HistoryView#HistoryView', tab: { label: 'History' } },
  } as EditConfigWithoutRoot
  return {
    ...config,
    fields: [...config.fields, ...historyFields()],
    hooks: {
      ...hooks,
      beforeOperation: [draftRollbackOnly, ...(hooks.beforeOperation ?? [])],
      beforeChange: [...(hooks.beforeChange ?? []), stampEditor],
      afterChange: [...(hooks.afterChange ?? []), logContentEvent],
    },
    endpoints: [...(config.endpoints || []), rollbackCheckEndpoint(config.slug)],
    admin: {
      ...config.admin,
      components: {
        ...config.admin?.components,
        views: { ...views, edit },
      },
    },
    versions: { ...(config.versions as object), maxPerDoc: 0 },
  }
}

/** withHistory on every collection with drafts; the rest are left as they are. */
export const applyHistory = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => (hasDrafts(c) ? withHistory(c) : c))
