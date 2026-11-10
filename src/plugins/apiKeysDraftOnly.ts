import type { CollectionConfig, Plugin } from 'payload'

import { publishStatusField } from '@/fields/publishStatus'

const hasDrafts = (c: CollectionConfig): boolean =>
  typeof c.versions === 'object' && Boolean(c.versions.drafts)

/**
 * API keys (users' REST keys and MCP keys) can save drafts but never publish,
 * on every collection with drafts. A plugin listed last, so it also covers
 * collections other plugins add and any collection added to the config later.
 */
export const apiKeysDraftOnlyPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((c) =>
    hasDrafts(c) ? { ...c, fields: [...c.fields, publishStatusField()] } : c,
  ),
})
