// src/rag/sync.ts
// Sends a document's sections to NCX post content, one post content per section.
import { createHash } from 'crypto'
import type { BasePayload } from 'payload'

import { recordPurge, recordSync } from './debug/record'
import { archivePostContent, ncxConfigured, upsertPostContent } from './ncx'
import { projectDoc } from './serialize'
import type { RagSection } from './types'
import { getRagSource } from './sources'

const MAPPINGS = 'ncxPostContents' as const

const siteUrl = () => (process.env.NCX_SITE_URL || 'https://neuroncx.in').replace(/\/+$/, '')

const hashOf = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32)

type Result = { sent: number; unchanged: number; archived: number }

/**
 * One section as the NCX post content it becomes: the title the dashboard
 * shows, the text the bot indexes, and the page it links to. Also used by
 * scripts/rag-dry-run.ts, so a dry run shows exactly what would be sent.
 */
export const composePostContent = (docTitle: string, path: string, section: RagSection) => {
  const sameAsTitle = section.heading.trim().toLowerCase() === docTitle.toLowerCase()
  const title = (sameAsTitle ? docTitle : `${docTitle} | ${section.heading}`).slice(0, 250)
  const link = `${siteUrl()}${path}${section.anchor ? `#${section.anchor}` : ''}`
  const text = [sameAsTitle ? docTitle : `${docTitle} - ${section.heading}`, section.body, `More: ${link}`].join(
    '\n\n',
  )
  return { title, text, link }
}

/**
 * How long one job may spend sending before it stops and lets a retry carry
 * on. The job runner on Amplify is an HTTP request with a hard timeout; a job
 * cut off mid-way would stay "processing" and never finish. Sections already
 * sent are recorded as they go, so the retry skips them.
 */
const DEFAULT_BUDGET_MS = 20_000
const budgetMs = () => Number(process.env.NCX_SYNC_BUDGET_MS) || DEFAULT_BUDGET_MS

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

/**
 * Brings NCX in line with what a visitor sees right now: sends changed
 * sections of the published document, and archives everything if it is not
 * published, hidden, or deleted. Every hook queues this, never a bare purge,
 * so saving a draft of a live page leaves NCX as it is.
 */
export const syncDoc = async (
  payload: BasePayload,
  { collection, id }: { collection: string; id: string; locale?: string },
  opts: { budgetMs?: number } = {},
): Promise<Result> => {
  const deadline = Date.now() + (opts.budgetMs ?? budgetMs())
  const source = getRagSource(collection)
  if (!source) return { sent: 0, unchanged: 0, archived: 0 }

  if (!ncxConfigured()) {
    payload.logger.warn('[ncx-sync] NCX_SYNC_URL / NCX_SYNC_KEY not set, skipping sync')
    return { sent: 0, unchanged: 0, archived: 0 }
  }

  const saved = await loadDoc(payload, collection, id)
  if (!saved || !source.shouldIndex(saved)) return purgeDoc(payload, { collection, id })
  const doc = source.prepare ? source.prepare(saved) : saved

  const docTitle = String(source.titleOf(doc) || '').trim() || 'NeuronCX'
  const path = source.urlOf(doc)
  const fields = payload.collections[collection as keyof typeof payload.collections].config.fields
  const sections = source.serialize
    ? await source.serialize(payload, doc)
    : projectDoc(fields, doc, {
        getBlock: (slug) => (payload.blocks as any)?.[slug],
        omit: source.omit,
      })

  const existing = new Map((await findMappings(payload, collection, id)).map((m) => [m.key, m]))
  let sent = 0
  let unchanged = 0
  let needsRetry = false

  let outOfTime = false

  for (const section of sections) {
    const key = `${collection}:${id}:${section.key}`
    const prev = existing.get(key)
    existing.delete(key)
    if (outOfTime) continue

    const { title, text, link } = composePostContent(docTitle, path, section)
    const hash = hashOf(`${title}\n${text}`)

    if (prev?.pcmId && !prev.archived && prev.hash === hash) {
      unchanged++
      continue
    }

    if (Date.now() > deadline) {
      outOfTime = true
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

  // Sections no longer on the page. Left for the retry when time ran out, so
  // a section is never archived on a partial pass.
  let archived = 0
  if (!outOfTime) {
    for (const m of existing.values()) {
      if (await archiveMapping(payload, m)) archived++
    }
  }

  payload.logger.info(
    `[ncx-sync] ${collection}/${id} "${docTitle}": sent ${sent}, unchanged ${unchanged}, archived ${archived}`,
  )
  await recordSync({ collection, id, title: docTitle, url: path, sections })

  if (outOfTime) {
    throw new Error(`[ncx-sync] ${collection}/${id}: sent ${sent} sections, more to send, will retry`)
  }

  if (needsRetry) {
    // A section was edited before NCX finished indexing it. Its hash was left
    // empty, so the retry sends just that section again.
    throw new Error(`[ncx-sync] ${collection}/${id}: NCX still indexing, will retry`)
  }

  return { sent, unchanged, archived }
}
