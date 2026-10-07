// src/rag/hooks.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { isRagSource, ragSources } from './sources'

/** Edits settle before we spend embedding calls on them. */
const SETTLE_MS = 30_000

type Status = 'published' | 'draft' | undefined

const queueSync = async (
  req: any,
  collection: string,
  id: string,
  queue: 'rag-realtime' | 'rag-bulk',
) =>
  req.payload.jobs.queue({
    task: 'ragSyncDoc',
    input: { collection, id, locale: req.locale ?? 'en' },
    queue,
    waitUntil: new Date(Date.now() + SETTLE_MS),
  })

const queuePurge = async (req: any, collection: string, id: string) =>
  req.payload.jobs.queue({
    task: 'ragPurgeDoc',
    input: { collection, id },
    queue: 'rag-realtime',
  })

/** Collections that embed content from `changedSlug`, resolved to doc ids. */
const fanOut = async (req: any, changedSlug: string, changedId: string) => {
  for (const [targetSlug, source] of Object.entries(ragSources)) {
    for (const dep of source.dependsOn ?? []) {
      if (dep.collection !== changedSlug) continue
      const ids = await dep.findAffected(req.payload, changedId)
      for (const id of ids) await queueSync(req, targetSlug, id, 'rag-bulk')
    }
  }
}

export const ragAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
  // our own reindex script writes through the Local API; don't re-queue what it just did
  if (req.context?.skipRag) return doc

  const slug = collection.slug
  const now: Status = doc?._status
  const before: Status = previousDoc?._status

  // Autosave on a draft. This is the overwhelming majority of calls
  // (interval is 100ms on pages and posts). Bail before doing any work.
  if (now !== 'published' && before !== 'published') return doc

  if (isRagSource(slug)) {
