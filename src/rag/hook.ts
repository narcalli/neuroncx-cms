// src/rag/hooks.ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { isRagSource, ragSources } from './sources'

const DEBOUNCE_MS = 60_000

export const ragAfterChange: CollectionAfterChangeHook = async ({ doc, collection, req }) => {
  const slug = collection.slug
  if (req.context?.skipRag) return doc

  if (isRagSource(slug)) {
    await req.payload.jobs.queue({
      task: 'ragSyncDoc',
      input: { collection: slug, id: String(doc.id), locale: req.locale ?? 'en' },
      queue: 'rag-realtime',
      // autosave fires this constantly; let edits settle before embedding
      waitUntil: new Date(Date.now() + DEBOUNCE_MS),
    })
  }

  // fan out to collections that embed this one
  for (const [targetSlug, source] of Object.entries(ragSources)) {
    for (const dep of source.dependsOn ?? []) {
      if (dep.collection !== slug) continue
      const ids = await dep.findAffected(req.payload, String(doc.id))
      for (const id of ids) {
        await req.payload.jobs.queue({
          task: 'ragSyncDoc',
          input: { collection: targetSlug, id, locale: req.locale ?? 'en' },
          queue: 'rag-bulk',
          waitUntil: new Date(Date.now() + DEBOUNCE_MS),
        })
      }
    }
  }

  return doc
}

export const ragAfterDelete: CollectionAfterDeleteHook = async ({ doc, id, collection, req }) => {
  if (!isRagSource(collection.slug)) return doc
  await req.payload.jobs.queue({
    task: 'ragPurgeDoc',
    input: { collection: collection.slug, id: String(id) },
    queue: 'rag-realtime',
  })
  return doc
}
