// src/rag/sync.ts
// Sends a document's sections to NCX post content, one post content per section.
import { createHash } from 'crypto'
import type { BasePayload } from 'payload'

import { recordPurge, recordSync } from './debug/record'
import { archivePostContent, ncxConfigured, upsertPostContent } from './ncx'
import { projectDoc } from './serialize'
import { ragSources } from './sources'

const MAPPINGS = 'ncxPostContents' as const

const siteUrl = () => (process.env.NCX_SITE_URL || 'https://neuroncx.in').replace(/\/+$/, '')

const hashOf = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32)

type Result = { sent: number; unchanged: number; archived: number }

const findMappings = async (payload: BasePayload, collection: string, id: string) => {
  const res = await payload.find({
    collection: MAPPINGS,
    where: { and: [{ sourceCollection: { equals: collection } }, { sourceId: { equals: id } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return res.docs as any[]
}

/**
 * Archives a section's post content but keeps the link to it, so if the
 * section comes back NCX reopens the same post content for review instead of
 * creating a second one.
 */
const archiveMapping = async (payload: BasePayload, m: any): Promise<boolean> => {
  if (m.archived) return false
  if (m.pcmId) await archivePostContent(m.pcmId)
  await payload.update({
    collection: MAPPINGS,
    id: m.id,
    data: { archived: true, hash: '', syncedAt: new Date().toISOString() },
    overrideAccess: true,
  })
  return true
}

const loadDoc = async (payload: BasePayload, collection: string, id: string) => {
  try {
    return await payload.findByID({
      collection: collection as any,
      id,
      depth: 0,
      draft: false,
      overrideAccess: true,
      disableErrors: true,
    })
  } catch {
    return null
  }
}

export const purgeDoc = async (
  payload: BasePayload,
  { collection, id }: { collection: string; id: string },
): Promise<Result> => {
  if (!ncxConfigured()) {
    payload.logger.warn('[ncx-sync] NCX_SYNC_URL / NCX_SYNC_KEY not set, skipping purge')
    return { sent: 0, unchanged: 0, archived: 0 }
  }

  let archived = 0
  for (const m of await findMappings(payload, collection, id)) {
    if (await archiveMapping(payload, m)) archived++
  }

  if (archived) payload.logger.info(`[ncx-sync] archived ${collection}/${id}: ${archived}`)
  await recordPurge({ collection, id })
  return { sent: 0, unchanged: 0, archived }
}

export const syncDoc = async (
  payload: BasePayload,
  { collection, id }: { collection: string; id: string; locale?: string },
): Promise<Result> => {
  const source = ragSources[collection]
  if (!source) return { sent: 0, unchanged: 0, archived: 0 }

  if (!ncxConfigured()) {
    payload.logger.warn('[ncx-sync] NCX_SYNC_URL / NCX_SYNC_KEY not set, skipping sync')
    return { sent: 0, unchanged: 0, archived: 0 }
  }

  const doc = await loadDoc(payload, collection, id)
  if (!doc || !source.shouldIndex(doc)) return purgeDoc(payload, { collection, id })

  const docTitle = String(source.titleOf(doc) || '').trim() || 'NeuronCX'
  const path = source.urlOf(doc)
  const fields = payload.collections[collection as keyof typeof payload.collections].config.fields
  const sections = projectDoc(fields, doc, {
    getBlock: (slug) => (payload.blocks as any)?.[slug],
    omit: source.omit,
  })

  const existing = new Map((await findMappings(payload, collection, id)).map((m) => [m.key, m]))
  let sent = 0
  let unchanged = 0
  let needsRetry = false

  for (const section of sections) {
    const key = `${collection}:${id}:${section.key}`
    const prev = existing.get(key)
    existing.delete(key)

    const sameAsTitle = section.heading.trim().toLowerCase() === docTitle.toLowerCase()
    const title = (sameAsTitle ? docTitle : `${docTitle} | ${section.heading}`).slice(0, 250)
    const link = `${siteUrl()}${path}${section.anchor ? `#${section.anchor}` : ''}`
    const text = [sameAsTitle ? docTitle : `${docTitle} - ${section.heading}`, section.body, `More: ${link}`].join(
      '\n\n',
    )
    const hash = hashOf(`${title}\n${text}`)

    if (prev?.pcmId && !prev.archived && prev.hash === hash) {
      unchanged++
      continue
    }

    const res = await upsertPostContent({ pcmId: prev?.pcmId, title, text, url: link })
    if (res.retry) needsRetry = true

    const data = {
      key,
      sourceCollection: collection,
      sourceId: id,
      sectionKey: section.key,
      title,
      pcmId: res.pcmId,
      hash: res.retry ? '' : hash,
      archived: false,
      syncedAt: new Date().toISOString(),
    }
    if (prev) {
      await payload.update({ collection: MAPPINGS, id: prev.id, data, overrideAccess: true })
    } else {
      await payload.create({ collection: MAPPINGS, data, overrideAccess: true })
    }
    sent++
  }

  // Sections no longer on the page.
  let archived = 0
  for (const m of existing.values()) {
    if (await archiveMapping(payload, m)) archived++
  }

  payload.logger.info(
    `[ncx-sync] ${collection}/${id} "${docTitle}": sent ${sent}, unchanged ${unchanged}, archived ${archived}`,
  )
  await recordSync({ collection, id, title: docTitle, url: path, sections })

  if (needsRetry) {
    // A section was edited before NCX finished indexing it. Its hash was left
    // empty, so the retry sends just that section again.
    throw new Error(`[ncx-sync] ${collection}/${id}: NCX still indexing, will retry`)
  }

  return { sent, unchanged, archived }
}
