import type { Access, CollectionBeforeOperationHook, CollectionConfig, Plugin } from 'payload'

import { isApiKeyRequest } from '@/access/apiKeyRequest'
import { unpublishOnlyCollection, unpublishOnlyGlobal } from '@/access/unpublishOnly'
import { publishStatusField } from '@/fields/publishStatus'
import { isUnpublish, targetsLiveEntry } from '@/review/unpublish'
import { publicError } from '@/utilities/publicError'

export const API_KEY_UNPUBLISH_MESSAGE = 'An API key cannot unpublish. A content owner or admin unpublishes from the admin.'

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

/** beforeOperation: no API key unpublishes a live entry, one at a time or from a list. */
const noUnpublishWithKey: CollectionBeforeOperationHook = async ({ args, collection, operation, req }) => {
  const a = args as Parameters<typeof isUnpublish>[0]
  if (operation !== 'update' || !isApiKeyRequest(req) || !isUnpublish(a)) return args
  if (await targetsLiveEntry(req, collection.slug, a)) throw publicError(API_KEY_UNPUBLISH_MESSAGE, 403)
  return args
}

/**
 * API keys (users' REST keys and MCP keys) can save drafts but never publish
 * or unpublish, on every collection with drafts, and never delete, on any
 * collection. On every collection and global, an unpublish request carries
 * nothing but the status (src/access/unpublishOnly.ts). A plugin listed last,
 * so it also covers collections other plugins add and any collection added to
 * the config later. Payload's own collections are added after plugins run, so
 * their access is set where they are configured.
 */
export const apiKeysDraftOnlyPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((c) => {
    const hooks = c.hooks ?? {}
    const guarded: CollectionConfig = {
      ...c,
      access: { ...c.access, delete: noDeleteWithKey(c.access?.delete) },
      hooks: {
        ...hooks,
        beforeOperation: [unpublishOnlyCollection, ...(hasDrafts(c) ? [noUnpublishWithKey] : []), ...(hooks.beforeOperation ?? [])],
      },
    }
    return hasDrafts(c) ? { ...guarded, fields: [...c.fields, publishStatusField()] } : guarded
  }),
  globals: config.globals?.map((g) => ({
    ...g,
    hooks: { ...g.hooks, beforeOperation: [unpublishOnlyGlobal, ...(g.hooks?.beforeOperation ?? [])] },
  })),
})
