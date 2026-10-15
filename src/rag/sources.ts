import type { RagSource } from './types'

/**
 * The collections sent to NCX post content, and when each document counts as
 * visible. Only Integration items for now. Each rule matches the collection's
 * public read access, so nothing reaches the bot that a site visitor could
 * not see.
 *
 * To add a collection: add it here and wrap it with withRag() in
 * payload.config.ts.
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

export const isRagSource = (slug: string): boolean => slug in ragSources
