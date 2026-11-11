/**
 * What the rubric scores for one entry (scripts/benchmark.ts): every section
 * as the NCX post it becomes (title line included), the page body the
 * knowledge base does not receive, and the fields the flattener leaves out.
 * Pending rows are left out throughout, as visitors and the bot never see them.
 */
import type { BasePayload, Block } from 'payload'

import { withoutPendingRows } from '../../src/content/pending'
import { getContentCollection } from '../../src/content/registry'
import type { LifecycleCollection } from '../../src/lifecycle/scope'
import { contentRagSource, serializeEntry } from '../../src/rag/content'
import { projectDoc } from '../../src/rag/serialize'
import { composePostContent } from '../../src/rag/sync'

export type Doc = Record<string, unknown>
export type Section = { key: string; heading: string; body: string }
export type Image = { at: string; file: string; alt: string }

export type Entry = {
  collection: LifecycleCollection
  slug: string
  name: string
  ownPage: boolean
  /** The knowledge base sections, as the NCX posts they become. */
  posts: Section[]
  /** Page blocks the knowledge base does not receive. */
  page: Section[]
  doc: Doc
  images: Image[]
  links: string[]
  /** Every string in the entry, for character and phrase checks. */
  raw: string
}

/** The lists the checks compare against (published, as visitors see them). */
export type Refs = {
  catalogue: string[]
  integrations: string[]
  customers: string[]
  thirdParties: string[]
  terms: string[]
}

export const str = (v: unknown) => (typeof v === 'string' ? v : '')
export const asDoc = (v: unknown): Doc | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Doc) : null)
export const rows = (v: unknown): Doc[] => (Array.isArray(v) ? v.map(asDoc).filter((d): d is Doc => d !== null) : [])

export const walk = (v: unknown, at: string, visit: (value: unknown, at: string) => void) => {
  visit(v, at)
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`, visit))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, at ? `${at}.${k}` : k, visit)
}

const imagesOf = (doc: Doc): Image[] => {
  const found: Image[] = []
  walk(doc, '', (v, at) => {
    const d = asDoc(v)
    if (d && typeof d.mimeType === 'string' && d.mimeType.startsWith('image/')) {
      found.push({ at, file: str(d.filename), alt: str(d.alt) })
    } else if (typeof v === 'string' && /Alt$/.test(at)) {
      found.push({ at, file: '', alt: v })
    }
  })
  return found
}

const linksOf = (doc: Doc): string[] => {
  const found: string[] = []
  walk(doc, '', (v, at) => {
    const d = asDoc(v)
    if (!d) return
    const ref = asDoc(d.reference)
    if (ref?.value) found.push(`${at}: ${str(d.label) || '(no label)'} -> ${str(ref.relationTo)}`)
    else if (typeof d.url === 'string' && d.url && !d.mimeType) found.push(`${at}: ${str(d.label) || '(no label)'} -> ${d.url}`)
  })
  for (const [k, v] of Object.entries(doc)) {
    const related = rows(v).filter((r) => typeof r.slug === 'string' && !r.mimeType && !r.blockType)
    if (related.length) found.push(`${k}: related ${related.map((r) => r.slug).join(', ')}`)
  }
  return [...new Set(found)]
}

/** One entry, from a document read with depth 1 (so media carry their alt text). */
export const buildEntry = async (payload: BasePayload, collection: LifecycleCollection, input: Doc): Promise<Entry> => {
  const registered = getContentCollection(collection)
  const source = contentRagSource(collection)
  if (!registered || !source) throw new Error(`${collection} is not a knowledge base collection`)
  const doc = withoutPendingRows(input)
  const sections = await serializeEntry(payload, registered, doc)
  const posts = sections.map((s) => {
    const post = composePostContent(source.titleOf(doc), source.urlOf(doc), s)
    return { key: s.key, heading: post.title, body: post.text }
  })
  const fields = payload.collections[collection].config.fields
  const blocks = payload.blocks as unknown as Record<string, Block | undefined>
  const sent = new Set(sections.map((s) => s.key))
  const page = projectDoc(fields, doc, { getBlock: (b) => blocks[b] }).filter((s) => !sent.has(s.key))
  return {
    collection,
    slug: str(doc.slug),
    name: str(doc.name) || str(doc.title),
    ownPage: Boolean(doc.hasOwnPage),
    posts,
    page,
    doc,
    images: imagesOf(doc),
    links: linksOf(doc),
    raw: ownText(doc),
  }
}

// Editors' fields, not content: who saved it, and an override's reason.
const NOT_READ = new Set(['updatedBy', 'rolledBackFrom', 'gateOverrideReason', 'gateOverrideHash'])

/**
 * Every string the entry itself holds. Stops at populated documents (another
 * entry's text, or the saving user's email address), keeping only an image's
 * alt text.
 */
const ownText = (doc: Doc): string => {
  const strings: string[] = []
  const visit = (v: unknown, top: boolean) => {
    if (typeof v === 'string') strings.push(v)
    else if (Array.isArray(v)) v.forEach((x) => visit(x, false))
    else if (v && typeof v === 'object') {
      const d = v as Doc
      if (!top && 'id' in d && ('createdAt' in d || 'updatedAt' in d)) {
        if (typeof d.mimeType === 'string') strings.push(str(d.alt))
        return
      }
      for (const [k, x] of Object.entries(d)) if (!NOT_READ.has(k)) visit(x, false)
    }
  }
  visit(doc, true)
  return strings.join('\n')
}

/** All the text a reader or the bot gets, section by section. */
export const sectionsOf = (e: Entry): Section[] => [...e.posts, ...e.page]

export const textOf = (e: Entry) => sectionsOf(e).map((s) => `${s.heading}\n${s.body}`).join('\n\n')

export const words = (s: string) => s.split(/\s+/).filter(Boolean).length

export const sentencesOf = (text: string) =>
  text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/))
    .map((s) => s.trim())
    .filter((s) => words(s) >= 3 && !/^More: https?:\/\//.test(s))
