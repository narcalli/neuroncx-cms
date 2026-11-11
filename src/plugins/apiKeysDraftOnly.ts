import type { Access, CollectionConfig, Plugin } from 'payload'

import { isApiKeyRequest } from '@/access/apiKeyRequest'
import { publishStatusField } from '@/fields/publishStatus'

const hasDrafts = (c: CollectionConfig): boolean =>
  typeof c.versions === 'object' && Boolean(c.versions.drafts)

/**
 * No API key deletes anything. Deleting is never a draft: a key could remove
 * a published page or the media a live page shows, at once. Otherwise the
 * collection's own rule (Payload's default, anyone signed in, when it has none).
 */
const noDeleteWithKey =
  (own: Access | undefined): Access =>
  async (args) =>
    !isApiKeyRequest(args.req) && (own ? await own(args) : Boolean(args.req.user))

/**
 * API keys (users' REST keys and MCP keys) can save drafts but never publish,
 * on every collection with drafts, and never delete, on any collection. A
 * plugin listed last, so it also covers collections other plugins add and any
 * collection added to the config later. Payload's own collections are added
 * after plugins run, so their access is set where they are configured.
 */
export const apiKeysDraftOnlyPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((c) => {
    const withDelete = { ...c, access: { ...c.access, delete: noDeleteWithKey(c.access?.delete) } }
    return hasDrafts(c) ? { ...withDelete, fields: [...c.fields, publishStatusField()] } : withDelete
  }),
})
