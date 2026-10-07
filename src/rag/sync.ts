// src/rag/sync.ts  -- stub. No Redis, no embeddings, nothing to go wrong.
import { recordSync, recordPurge } from './debug/record'
import type { BasePayload } from 'payload'
import { ragSources } from './sources'

export const syncDoc = async (
  payload: BasePayload,
  { collection, id, locale }: { collection: string; id: string; locale?: string },
) => {
  const source = ragSources[collection]
  if (!source) return { chunksEmbedded: 0, chunksDeleted: 0 }

  const doc = await payload.findByID({
    collection: collection as any,
    id,
    depth: 1,
    locale: locale as any,
    draft: false,
    overrideAccess: true,
  })

  if (!source.shouldIndex(doc)) {
    payload.logger.info(`[rag] skip ${collection}/${id}, not indexable`)
    return { chunksEmbedded: 0, chunksDeleted: 0 }
  }

  const { title, sections } = source.project(doc, () => '')

  payload.logger.info(
    `[rag] SYNC ${collection}/${id} "${title}" url=${source.urlOf(doc)} sections=${sections.length}`,
  )
  return { chunksEmbedded: sections.length, chunksDeleted: 0 }
}

export const purgeDoc = async (
  payload: BasePayload,
  { collection, id }: { collection: string; id: string },
) => {
  payload.logger.info(`[rag] PURGE ${collection}/${id}`)
  return { chunksDeleted: 0 }
}
