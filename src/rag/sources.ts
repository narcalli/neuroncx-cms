import { contentRagSource, hubRagSource } from './content'
import type { RagSource } from './types'

/**
 * The collections sent to NCX post content, and when each document counts as
 * visible. Each rule matches the collection's public read access, so nothing
 * reaches the bot that a site visitor could not see.
 *
 * Listed here: collections with their own rules (Integration items). Found
 * through the content registry, with nothing to add here: every collection
 * built with defineContentCollection() that has the kbase group (the factory
 * wraps it with withRag()), and hubs (src/rag/content.ts).
 *
 * To add another collection by hand: add it here and wrap it with withRag()
 * in payload.config.ts.
 */

const published = (d: any) => d?._status === 'published'

export const ragSources: Record<string, RagSource> = {
  integrations: {
    collection: 'integrations',
    shouldIndex: (d) => published(d) && d.status === 'live' && d.includeInKbase !== false,
    titleOf: (d) => d.name,
    urlOf: (d) => (d.hasOwnPage && d.slug ? `/integrations/${d.slug}` : '/integrations'),
  },
}

/** The source for a collection: listed here, a hub, or a registered content collection. */
export const getRagSource = (slug: string): RagSource | undefined =>
  ragSources[slug] ?? (slug === 'hubs' ? hubRagSource : contentRagSource(slug))

export const isRagSource = (slug: string): boolean => Boolean(getRagSource(slug))
