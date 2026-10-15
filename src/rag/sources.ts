import { stripForVisitors } from '../collections/Customers'
import type { RagSource } from './types'

/**
 * The collections sent to NCX post content, and when each document counts as
 * visible. Each rule matches the collection's public read access, so nothing
 * reaches the bot that a site visitor could not see.
 */

const published = (d: any) => d?._status === 'published'

/** Slugs may already carry a path ("/integrations/ncx-integration-docpulse"). */
const pagePath = (slug: string | undefined) => {
  if (!slug || slug === 'home') return '/'
  return slug.startsWith('/') ? slug : `/${slug}`
}

export const ragSources: Record<string, RagSource> = {
  pages: {
    collection: 'pages',
    shouldIndex: (d) => published(d) && Boolean(d.slug),
    titleOf: (d) => d.title,
    urlOf: (d) => pagePath(d.slug),
  },

  posts: {
    collection: 'posts',
    shouldIndex: (d) => published(d) && Boolean(d.slug),
    titleOf: (d) => d.title,
    urlOf: (d) => `/posts/${d.slug}`,
    omit: ['populatedAuthors'],
  },

  features: {
    collection: 'features',
    shouldIndex: (d) => published(d),
    titleOf: (d) => d.title,
    urlOf: () => '/',
  },

  // Same stripping as the public API: a customer with "Show real name" off is
  // sent under its anonymised name, without the details that would identify it.
  customers: {
    collection: 'customers',
    shouldIndex: (d) => published(d) && d.status !== 'past',
    prepare: stripForVisitors,
    titleOf: (d) => d.name || 'A customer',
    urlOf: (d) => (d.hasOwnPage && d.slug ? `/customers/${d.slug}` : '/customers'),
  },

  integrations: {
    collection: 'integrations',
    shouldIndex: (d) => published(d) && d.status === 'live' && d.includeInKbase !== false,
    titleOf: (d) => d.name,
    urlOf: (d) => (d.hasOwnPage && d.slug ? `/integrations/${d.slug}` : '/integrations'),
  },

  integrationsMaster: {
    collection: 'integrationsMaster',
    shouldIndex: (d) => published(d) && d.includeInKbase !== false,
    titleOf: (d) => d.name,
    urlOf: () => '/integrations',
  },
}

export const isRagSource = (slug: string): boolean => slug in ragSources
