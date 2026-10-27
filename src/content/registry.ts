import type { CollectionSlug } from 'payload'

import type { ListType } from '../collections/Lists'
import type { HeroDesignName } from '../fields/heroDesign'
import type { DefaultLayoutRow } from './sections/defineSection'

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

/**
 * How a collection's entries get their address (defineContentCollection's
 * route option): under a route base (/crm/{slug}), at the root of the site
 * (/{slug}), or under the entry a field links to (/{parent slug}/{slug}).
 */
export type ContentRouting =
  | { kind: 'none' }
  | { kind: 'base'; base: string }
  | { kind: 'root' }
  | { kind: 'parent'; collection: string; field: string }

export type ContentCollectionEntry = {
  slug: string
  label: { singular: string; plural: string }
  /**
   * Route base for entry pages and the hub, such as /crm. Null for cards-only
   * collections and for entries served at the root or under a parent entry.
   */
  route: string | null
  /** True when entries have an address of any kind (see routing). */
  hasRoute: boolean
  routing: ContentRouting
  /** Whether entries can have their own page (the ownPage group, with hasOwnPage). */
  ownPage: boolean
  /** Whether entries have the SEO tab, with meta.primaryKeyword. */
  seo: boolean
  /** The Lists type entries are grouped by, and the field that holds it. */
  grouping: { listType: ListType; field: string; required: boolean } | null
  /** Section keys editors may add to the layout field. */
  sections: string[]
  /**
   * Section keys an entry page follows while usePageDefaults is on, in order,
   * when the collection's hub has no published default layout
   * (src/content/hubs.ts).
   */
  defaultLayout: DefaultLayoutRow[]
  /** This collection's default heading for a section, by key, where it differs from the section's own. */
  headings: Record<string, string>
  /** Whether entries go to the knowledge base (the kbase group). */
  kbase: boolean
  /** The hero designs an entry's own page may use (heroDesign). Empty without the ownPage group. */
  heroDesigns: HeroDesignName[]
  /** The page blocks the layout offers besides its sections, by slug. */
  siteBlocks: string[]
  /**
   * siteBlocks 'all': every page block, the layout heroes and the plain faq
   * block included, with the rules that keep one H1, one FAQ and one
   * closing panel (src/fields/layout.ts).
   */
  freeLayout: boolean
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
const HUBS_AT_ROUTE = new Set<string>(['microApps'])

/** Where the hub page renders on the website today, or null without a route. */
export const hubPagePath = (entry: Pick<ContentCollectionEntry, 'slug' | 'route'>): string | null =>
  entry.route ? (HUBS_AT_ROUTE.has(entry.slug) ? entry.route : `${entry.route}-preview`) : null

/** The content collection grouped by a Lists type, such as agentFamily. */
export const collectionForListType = (listType: unknown): ContentCollectionEntry | undefined =>
  [...entries.values()].find((e) => e.grouping?.listType === listType)

/** The hub page of a collection: its route base, or null without a route. */
export const hubPath = (entry: Pick<ContentCollectionEntry, 'route'>): string | null => entry.route

/**
 * An entry's own page, or null when it has none. Under a route base it is
 * {route}/{slug}; at the root or under a parent entry it is the path stored
 * on the entry, set on save (src/content/paths.ts).
 */
export const entryPath = (
  entry: Pick<ContentCollectionEntry, 'route'> & { routing?: ContentRouting },
  doc: { slug?: unknown; hasOwnPage?: unknown; path?: unknown } | null | undefined,
): string | null => {
  if (!doc?.hasOwnPage) return null
  const kind = entry.routing?.kind
  if (kind === 'root' || kind === 'parent') return typeof doc.path === 'string' && doc.path ? doc.path : null
  return entry.route && typeof doc.slug === 'string' && doc.slug ? `${entry.route}/${doc.slug}` : null
}
