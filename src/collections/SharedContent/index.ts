import type { BlockSlug, CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, PayloadRequest, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { idOf, savedPagePath } from '../../content/paths'
import { contentCollections, entryPath, getContentCollection, hubPagePath } from '../../content/registry'
import { revalidateContent } from '../../content/revalidate'

/**
 * Shared content: one site block, written once and placed on several pages,
 * such as a trust panel every industry page shows. Not a content collection
 * (no factory, no route): a record has no page of its own.
 *
 * A placement is any block, on a page, a hub or a content entry, with a
 * `sharedContent` field linking to the record, or the industry pages' Shared
 * content section, whose `item` links it. Publishing a record refreshes
 * every page that places it (revalidateSharedPlacements).
 */

/** The blocks a record may hold, defined once at the top of the config. */
export const SHARED_BLOCKS = ['trustPanel', 'howItWorks2', 'productSuite2', 'bentoGrid', 'statBand'] as const

const KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const validateKey: TextFieldSingleValidation = (value, options) => {
  const base = text(value, options)
  if (base !== true) return base
  if (typeof value !== 'string' || !value) return true
  return KEY_PATTERN.test(value) ? true : 'Lowercase letters, numbers and single dashes only, such as industry-trust.'
}

/** Whether a document places the record: any block or object in it whose sharedContent links to it. */
const places = (value: unknown, id: string): boolean => {
  if (Array.isArray(value)) return value.some((v) => places(v, id))
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  if ('sharedContent' in obj && idOf(obj.sharedContent) === id) return true
  // The industry pages' Shared content section links it as item.
  if (obj.blockType === 'sharedSection' && idOf(obj.item) === id) return true
  return Object.values(obj).some((v) => places(v, id))
}

/**
 * The addresses of every published page, hub and content entry that places
 * the record. Read in full and searched here rather than queried, so it works
 * before any block has a sharedContent field.
 */
export const placementPaths = async (req: PayloadRequest, id: string): Promise<string[]> => {
  const all = { depth: 0, limit: 0, pagination: false, overrideAccess: true, req, where: { _status: { equals: 'published' } } } as const
  const paths: string[] = []
  for (const page of (await req.payload.find({ ...all, collection: 'pages' })).docs) {
    if (places(page, id)) paths.push(await savedPagePath(req, page as any))
  }
  for (const hub of (await req.payload.find({ ...all, collection: 'hubs' })).docs as any[]) {
    const entry = getContentCollection(hub.forCollection)
    const path = entry ? hubPagePath(entry) : null
    if (path && places(hub, id)) paths.push(path)
  }
  for (const entry of contentCollections()) {
    if (!entry.ownPage) continue
    for (const doc of (await req.payload.find({ ...all, collection: entry.slug as any })).docs) {
      const path = entryPath(entry, doc as any)
      if (path && places(doc, id)) paths.push(path)
    }
  }
  return [...new Set(paths.filter(Boolean))].slice(0, 50)
}

/** afterChange: when the record is published, or was, every page that places it. */
export const revalidateSharedPlacements: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate) return doc
  if (doc?._status !== 'published' && previousDoc?._status !== 'published') return doc
  const paths = await placementPaths(req, String(doc.id))
  if (paths.length) {
    await revalidateContent({ collection: 'sharedContent', paths, reason: `shared content ${doc.key ?? doc.id} changed`, logger: req.payload?.logger })
  }
  return doc
}

/** afterDelete: the pages that placed it. */
export const revalidateSharedPlacementsAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const paths = await placementPaths(req, String(doc.id))
  if (paths.length) {
    await revalidateContent({ collection: 'sharedContent', paths, reason: `shared content ${doc.key ?? doc.id} deleted`, logger: req.payload?.logger })
  }
  return doc
}

export const SharedContent: CollectionConfig = {
  slug: 'sharedContent',
  labels: { singular: 'Shared content', plural: 'Shared content' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    // The Industries collection's group (its plural label), beside the pages that place it.
    group: 'Industries',
    defaultColumns: ['name', 'key', 'updatedAt'],
    description: 'One block written once and placed on several pages. A change here reaches every page that places it.',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateSharedPlacements],
    afterDelete: [revalidateSharedPlacementsAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true, maxLength: 60 },
    {
      name: 'key',
      type: 'text',
      label: 'Key',
      required: true,
      unique: true,
      index: true,
      maxLength: 30,
      validate: validateKey,
      admin: { description: 'How code and other records refer to it. Lowercase letters, numbers and dashes, such as industry-trust.' },
    },
    {
      name: 'block',
      type: 'blocks',
      label: 'Block',
      required: true,
      minRows: 1,
      maxRows: 1,
      blocks: [],
      // The site blocks themselves, by reference, so each is defined once.
      blockReferences: [...SHARED_BLOCKS] as BlockSlug[],
      admin: { description: 'Exactly one: a trust panel, how it works, card grid, bento grid or stat band.' },
    },
  ],
}
