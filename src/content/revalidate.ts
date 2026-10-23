import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { entryPath, hubPath, type ContentCollectionEntry } from './registry'

type Logger = { info?: (message: string) => void; error?: (message: string) => void }

const TIMEOUT_MS = 3000

/**
 * Asks the website to refresh the given paths and the collection's cached
 * content (neuroncx-website src/app/(frontend)/api/revalidate/route.ts).
 * Needs NEXT_PUBLIC_SITE_URL (the website's address, also used for preview)
 * and REVALIDATE_SECRET, the same value on both sides. Without them it only
 * logs, and the website catches up within its 60 second cache.
 *
 * Never fails a save: a slow or failing website is logged and left.
 * TODO: the pages that list this collection on other pages (foundation.md
 * section 4.3) refresh through the collection tag, not by path.
 */
export const revalidateContent = async ({
  collection,
  paths,
  reason,
  logger,
}: {
  collection: string
  paths: string[]
  reason: string
  logger?: Logger
}): Promise<void> => {
  const summary = `${collection} (${reason}): ${paths.length ? paths.join(', ') : 'no paths'}`
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '')
  const secret = process.env.REVALIDATE_SECRET
  if (!site || !secret) {
    logger?.info?.(`[content] revalidate skipped, website not configured: ${summary}`)
    return
  }
  try {
    const res = await fetch(`${site}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ paths, collection }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) logger?.info?.(`[content] revalidated ${summary}`)
    else logger?.error?.(`[content] revalidate failed, website said ${res.status}: ${summary}`)
  } catch (err) {
    logger?.error?.(`[content] revalidate failed (${(err as Error).message}): ${summary}`)
  }
}

const unique = (paths: (string | null)[]): string[] => [
  ...new Set(paths.filter((p): p is string => Boolean(p))),
]

/**
 * afterChange: when the entry is published, or was before this change, the
 * entry page and the hub. The page it had before is included, so an
 * unpublish, a slug change or Own page switched off clears the old page too.
 * Draft saves change nothing a visitor sees, so they are skipped.
 */
export const revalidateAfterChange =
  (entry: ContentCollectionEntry): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    if (req.context?.disableRevalidate) return doc
    const now = doc?._status === 'published'
    const before = previousDoc?._status === 'published'
    if (!now && !before) return doc
    await revalidateContent({
      collection: entry.slug,
      paths: unique([
        now ? entryPath(entry, doc) : null,
        before ? entryPath(entry, previousDoc) : null,
        hubPath(entry),
      ]),
      reason: now ? 'published or updated' : 'unpublished',
      logger: req.payload?.logger,
    })
    return doc
  }

/** afterDelete: the entry page it had, and the hub. */
export const revalidateAfterDelete =
  (entry: ContentCollectionEntry): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    if (req.context?.disableRevalidate) return doc
    await revalidateContent({
      collection: entry.slug,
      paths: unique([entryPath(entry, doc), hubPath(entry)]),
      reason: 'deleted',
      logger: req.payload?.logger,
    })
    return doc
  }
