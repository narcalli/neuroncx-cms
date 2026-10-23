import type { CollectionSlug } from 'payload'

import type { ListType } from '../collections/Lists'

/**
 * Every content collection built with defineContentCollection(), keyed by
 * slug (docs/cms/foundation.md, sections 2 and 4.3). Routes, the sitemap, the
 * collection cards block, the knowledge base and the WhatsApp endpoint read
 * this instead of each keeping its own list.
 *
 * The factory adds a collection when its config file is imported, so the
 * registry is complete once payload.config.ts has loaded.
 */

export type ContentKbOptions = {
  /** Relationships sent to the knowledge base as names, such as the grouping. */
  resolve: string[]
  /** Fields left out of the knowledge base. */
  exclude: string[]
}

export type ContentCollectionEntry = {
  slug: string
  label: { singular: string; plural: string }
  /** Route base for entry pages and the hub, such as /crm. Null for cards-only collections. */
  route: string | null
  hasRoute: boolean
  /** The Lists type entries are grouped by, and the field that holds it. */
  grouping: { listType: ListType; field: string; required: boolean } | null
  /** Section keys editors may add to the layout field. */
  sections: string[]
  /**
   * Section keys an entry page follows while usePageDefaults is on, in order,
   * when the collection's hub has no published default layout
   * (src/content/hubs.ts).
   */
  defaultLayout: string[]
  /** This collection's default heading for a section, by key, where it differs from the section's own. */
  headings: Record<string, string>
  /** Whether entries go to the knowledge base (the kbase group). */
  kbase: boolean
  kb: ContentKbOptions
}

const entries = new Map<string, ContentCollectionEntry>()

/**
 * Adds or replaces a collection. Replacing, not refusing, keeps hot reload
 * working when a collection's file is evaluated again.
 */
export const registerContentCollection = (entry: ContentCollectionEntry): void => {
  entries.set(entry.slug, entry)
}

export const getContentCollection = (slug: string): ContentCollectionEntry | undefined =>
  entries.get(slug)

export const isContentCollection = (slug: string): boolean => entries.has(slug)

/** Every registered collection, in the order they were defined. */
export const contentCollections = (): ContentCollectionEntry[] => [...entries.values()]

/** Slugs of every registered collection, typed for relationTo. */
export const contentSlugs = (): CollectionSlug[] => [...entries.keys()] as CollectionSlug[]

/**
 * Hubs that serve their collection's route base on the website. Until a hub
 * does, the route base is still a CMS page and the hub renders at the route
 * plus "-preview" (neuroncx-website src/content/registry.ts, hubAtRoute).
 */
const HUBS_AT_ROUTE = new Set<string>()

/** Where the hub page renders on the website today, or null without a route. */
export const hubPagePath = (entry: Pick<ContentCollectionEntry, 'slug' | 'route'>): string | null =>
  entry.route ? (HUBS_AT_ROUTE.has(entry.slug) ? entry.route : `${entry.route}-preview`) : null

/** The content collection grouped by a Lists type, such as agentFamily. */
export const collectionForListType = (listType: unknown): ContentCollectionEntry | undefined =>
  [...entries.values()].find((e) => e.grouping?.listType === listType)

/** The hub page of a collection: its route base, or null without a route. */
export const hubPath = (entry: Pick<ContentCollectionEntry, 'route'>): string | null => entry.route

/** An entry's own page, or null when it has none. */
export const entryPath = (
  entry: Pick<ContentCollectionEntry, 'route'>,
  doc: { slug?: unknown; hasOwnPage?: unknown } | null | undefined,
): string | null =>
  entry.route && doc?.hasOwnPage && typeof doc.slug === 'string' && doc.slug
    ? `${entry.route}/${doc.slug}`
    : null
