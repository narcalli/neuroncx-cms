// src/rag/hooks.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { isRagSource } from './sources'

/** Edits settle before we spend embedding calls on them. */
const SETTLE_MS = 30_000

/** The queue the scheduled runner works through (see docs/cms/ncx-sync.md). */
export const RAG_QUEUE = 'ncx-sync'

type Status = 'published' | 'draft' | undefined

const queueSync = async (req: any, collection: string, id: string) =>
  req.payload.jobs.queue({
    task: 'ragSyncDoc',
    input: { collection, id, locale: req.locale ?? 'en' },
    queue: RAG_QUEUE,
    waitUntil: new Date(Date.now() + SETTLE_MS),
  })

const queuePurge = async (req: any, collection: string, id: string) =>
  req.payload.jobs.queue({
    task: 'ragPurgeDoc',
    input: { collection, id },
    queue: RAG_QUEUE,
  })

export const ragAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
  // our own reindex script writes through the Local API; don't re-queue what it just did
  if (req.context?.skipRag) return doc

  const slug = collection.slug
  if (!isRagSource(slug)) return doc

  const now: Status = doc?._status
  const before: Status = previousDoc?._status

  // Autosave on a draft. This is the overwhelming majority of calls
  // (interval is 100ms on pages and posts). Bail before doing any work.
  if (now !== 'published' && before !== 'published') return doc

  if (now === 'published') {
    // Published or republished: send the latest content. The sync itself
    // decides whether the document is visible (status, Live, Own page...).
    await queueSync(req, slug, String(doc.id))
  } else if (before === 'published') {
    // Unpublished: archive its post contents.
    await queuePurge(req, slug, String(doc.id))
  }

  return doc
}

export const ragAfterDelete: CollectionAfterDeleteHook = async ({ doc, id, collection, req }) => {
  if (req.context?.skipRag) return doc
  if (!isRagSource(collection.slug)) return doc

  await queuePurge(req, collection.slug, String(doc?.id ?? id))
  return doc
}
