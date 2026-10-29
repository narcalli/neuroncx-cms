import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { revalidateContent } from '../content/revalidate'

/**
 * Tells the website to refresh, for collections and globals outside the
 * content factory (integrations, customers, posts, redirects, the header
 * and footer, the integration lists). The older revalidateFrontend() calls
 * only reach the CMS's own Next cache, so without these the website waited
 * out its 60 second cache. The website maps the collection to its cache
 * tags (neuroncx-website src/app/(frontend)/api/revalidate/route.ts).
 */

type Paths = (doc: Record<string, any>) => (string | null | undefined)[]

/** Published, or in a collection without drafts. */
const live = (doc: Record<string, any> | null | undefined): boolean =>
  Boolean(doc) && (doc!._status === undefined || doc!._status === 'published')

const unique = (paths: (string | null | undefined)[]): string[] => [
  ...new Set(paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/'))),
]

/** afterChange: when the document is live, or was before this change (an unpublish or a slug change clears the old page). Draft saves are skipped. */
export const revalidateOnSite =
  (collection: string, paths: Paths = () => []): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    if (req.context?.disableRevalidate) return doc
    const now = live(doc)
    const before = live(previousDoc)
    if (!now && !before) return doc
    await revalidateContent({
      collection,
      paths: unique([...(now ? paths(doc) : []), ...(before && previousDoc ? paths(previousDoc) : [])]),
      reason: now ? 'published or updated' : 'unpublished',
      logger: req.payload?.logger,
    })
    return doc
  }

/** afterDelete: the pages a live document was on. */
export const revalidateOnSiteAfterDelete =
  (collection: string, paths: Paths = () => []): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    if (req.context?.disableRevalidate || !live(doc)) return doc
    await revalidateContent({ collection, paths: unique(paths(doc)), reason: 'deleted', logger: req.payload?.logger })
    return doc
  }

/** afterChange for a global shown on every page: the website refreshes its layout. */
export const revalidateGlobalOnSite =
  (global: string): GlobalAfterChangeHook =>
  async ({ doc, req }) => {
    if (req.context?.disableRevalidate) return doc
    await revalidateContent({ collection: global, paths: ['/'], reason: 'changed', logger: req.payload?.logger })
    return doc
  }
