import type { Block, Field, Tab } from 'payload'

import type { RagSection } from './types'

/**
 * Turns a Payload document into sections of plain text for NCX post content.
 *
 * It walks the document together with its collection's field config, so it
 * works for every block and collection without per-block code:
 *
 * - every block in a blocks field becomes its own section (keyed by block id)
 * - every tab becomes a section (keyed by tab name or label)
 * - a long top-level rich text field (a post body) is split at its headings
 * - the remaining top-level fields form an "Overview" section
 *
 * Only words a visitor reads are kept: text, textarea and rich text. Selects,
 * numbers, dates, checkboxes, media, relationships, links and SEO are left out.
 */

/** Section length cap, in characters. Longer sections are split into parts. */
export const MAX_SECTION_CHARS = 2400
/** Sections shorter than this carry too little to answer from. */
export const MIN_SECTION_CHARS = 40

/** Never sent, whatever collection they appear in. */
const SKIP_FIELDS = new Set([
  'id',
  'meta',
  'slug',
  'url',
  'href',
  'anchorId',
  'anchor',
  'icon',
  'iconName',
  'embedUrl',
  'videoUrl',
  'email',
  'blockName',
  'populatedAuthors',
  'headingOverrides',
])

/** Groups that hold buttons or links: their labels are "Book a demo" style noise. */
const LINK_GROUP = /(link|links|cta|ctas|button|buttons)$/i

/** Tabs that are about where content goes, not what it says. */
const SKIP_TAB = /^(seo|meta|whatsapp)$/i

/** WhatsApp message fields (waBody, waRowTitle...) are channel copies of the same content. */
const isChannelField = (name: string) => /^wa[A-Z]/.test(name)

/**
 * Addresses and ids (ctaUrl, htmlId, formId) and button copy (ctaLabel,
 * primaryLabel, buttonText) by naming convention. Case-sensitive on purpose:
 * "Id" at the end of a camelCase name, not "paid".
 */
const isPlumbingField = (name: string) =>
  /(Url|URL|Href|Id|Ids)$/.test(name) ||
  /^(cta|button)/i.test(name) ||
  /(Cta|Button)/.test(name) ||
  /^(primary|secondary)(Label|Text)$/.test(name)

/** Field names that make a good heading for a block, in order of preference. */
const HEADING_FIELDS = ['heading', 'title', 'headline', 'name', 'eyebrow', 'label']

type BlockLookup = (slug: string) => Block | undefined

type Ctx = {
  getBlock: BlockLookup
  omit: Set<string>
  inLink?: boolean
}

const clean = (s: string) =>
  s
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim()

const humanize = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

const labelText = (label: unknown): string => {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    const first = Object.values(label as Record<string, unknown>).find((v) => typeof v === 'string')
    return (first as string) || ''
  }
  return ''
}

/* ----------------------------- Lexical ----------------------------------- */

type RtPart = { heading?: string; text: string }

const inlineText = (node: any): string => {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.type === 'linebreak') return '\n'
  if (node.type === 'tab') return ' '
  if (Array.isArray(node.children)) return node.children.map(inlineText).join('')
  return ''
}

/** Strings inside a Lexical block node (Banner, Code...), without schema. */
const looseStrings = (value: unknown, out: string[]) => {
  if (typeof value === 'string') {
    if (value.trim() && !/^(https?:|\/|#)/.test(value)) out.push(value.trim())
    return
  }
  if (Array.isArray(value)) return value.forEach((v) => looseStrings(v, out))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, any>
    if (obj.root) return out.push(...lexicalParts(obj).map((p) => p.text))
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'id' || k === 'blockType' || k === 'blockName' || SKIP_FIELDS.has(k)) continue
      looseStrings(v, out)
    }
  }
}

const listText = (node: any, depth = 0): string[] =>
  (node.children || []).flatMap((item: any) => {
    const nested = (item.children || []).filter((c: any) => c.type === 'list')
    const own = { ...item, children: (item.children || []).filter((c: any) => c.type !== 'list') }
    const line = clean(inlineText(own))
    return [
      ...(line ? [`${'  '.repeat(depth)}- ${line}`] : []),
      ...nested.flatMap((n: any) => listText(n, depth + 1)),
    ]
  })

/** Rich text as a flat list of headings and paragraphs. */
export const lexicalParts = (value: any): RtPart[] => {
  const children = value?.root?.children
  if (!Array.isArray(children)) return []
  const parts: RtPart[] = []
  for (const node of children) {
    switch (node.type) {
      case 'heading': {
        const text = clean(inlineText(node))
        if (text) parts.push({ heading: text, text })
        break
      }
      case 'list': {
        const lines = listText(node)
        if (lines.length) parts.push({ text: lines.join('\n') })
        break
      }
      case 'block': {
        const out: string[] = []
        looseStrings(node.fields, out)
        if (out.length) parts.push({ text: clean(out.join('\n')) })
        break
      }
      case 'upload':
      case 'horizontalrule':
        break
      default: {
        const text = clean(inlineText(node))
        if (text) parts.push({ text })
      }
    }
  }
  return parts
}

export const lexicalToText = (value: any): string =>
  lexicalParts(value)
    .map((p) => p.text)
    .join('\n')

/* ----------------------------- Fields ------------------------------------ */

const blocksOf = (field: any, ctx: Ctx): Block[] => [
  ...((field.blocks as Block[]) || []),
  ...((field.blockReferences as (Block | string)[]) || [])
    .map((b) => (typeof b === 'string' ? ctx.getBlock(b) : b))
    .filter((b): b is Block => Boolean(b)),
]

const findBlock = (field: any, slug: string, ctx: Ctx) =>
  blocksOf(field, ctx).find((b) => b.slug === slug) || ctx.getBlock(slug)

const tabData = (tab: Tab, data: any) => ('name' in tab && tab.name ? data?.[tab.name] : data)

const tabKey = (tab: Tab) => ('name' in tab && tab.name ? tab.name : labelText(tab.label) || 'tab')

const skipTab = (tab: Tab) => SKIP_TAB.test(tabKey(tab)) || SKIP_TAB.test(labelText(tab.label))

const skipField = (name: string, ctx: Ctx) =>
  SKIP_FIELDS.has(name) || ctx.omit.has(name) || isChannelField(name) || isPlumbingField(name)

/**
 * Text a visitor reads in these fields, as paragraphs. Array rows and blocks
 * become one paragraph each, so a stat reads "1,300+ - Leads handled a day".
 */
export const fieldText = (fields: Field[], data: any, ctx: Ctx): string[] => {
  if (!data || typeof data !== 'object') return []
  const out: string[] = []

  for (const field of fields as any[]) {
    switch (field.type) {
      case 'tabs':
        for (const tab of field.tabs as Tab[]) {
          if (!skipTab(tab)) out.push(...fieldText(tab.fields, tabData(tab, data), ctx))
        }
        continue
      case 'row':
      case 'collapsible':
        out.push(...fieldText(field.fields, data, ctx))
        continue
    }

    const name: string | undefined = field.name
    if (!name || skipField(name, ctx)) continue
    const value = data[name]
    if (value == null || value === '') continue

    switch (field.type) {
      case 'text':
      case 'textarea': {
        if (ctx.inLink && name === 'label') break
        const values = Array.isArray(value) ? value : [value]
        for (const v of values) if (typeof v === 'string' && v.trim()) out.push(clean(v))
        break
      }
      case 'richText': {
        const text = lexicalToText(value)
        if (text) out.push(text)
        break
      }
      case 'group': {
        const sub = { ...ctx, inLink: ctx.inLink || LINK_GROUP.test(name) }
        out.push(...fieldText(field.fields, value, sub))
        break
      }
      case 'array': {
        const sub = { ...ctx, inLink: ctx.inLink || LINK_GROUP.test(name) }
        for (const row of value as any[]) {
          const parts = fieldText(field.fields, row, sub)
          if (parts.length) out.push(parts.join(' - '))
        }
        break
      }
      case 'blocks': {
        for (const block of value as any[]) {
          const config = findBlock(field, block?.blockType, ctx)
          if (!config) continue
          const parts = fieldText(config.fields, block, ctx)
          if (parts.length) out.push(parts.join('\n'))
        }
        break
      }
      default:
        // select, radio, number, date, checkbox, upload, relationship, join,
        // json, code, point, ui: settings or references, not words to answer from
        break
    }
  }
  return out
}

const blockHeading = (block: any, config: Block | undefined): string => {
  for (const name of HEADING_FIELDS) {
    const v = block?.[name]
    if (typeof v === 'string' && v.trim()) return clean(v).split('\n')[0].slice(0, 120)
  }
  if (typeof block?.blockName === 'string' && block.blockName.trim()) return block.blockName.trim()
  return labelText(config?.labels?.singular) || humanize(block?.blockType || 'Section')
}

/* ----------------------------- Sections ---------------------------------- */

type Unit = { key: string; heading: string; parts: string[]; anchor?: string; raw?: unknown }

/** Splits a document-level rich text (a post body) at its headings. */
const richTextUnits = (name: string, value: any, fallbackHeading: string): Unit[] => {
  const units: Unit[] = []
  let current: Unit = { key: `${name}:0`, heading: fallbackHeading, parts: [] }
  for (const part of lexicalParts(value)) {
    if (part.heading) {
      if (current.parts.length) units.push(current)
      current = { key: `${name}:${units.length + 1}`, heading: part.heading, parts: [] }
      continue
    }
    current.parts.push(part.text)
  }
  if (current.parts.length) units.push(current)
  return units
}

const collectUnits = (
  fields: Field[],
  data: any,
  ctx: Ctx,
  rest: { key: string; heading: string },
): Unit[] => {
  if (!data || typeof data !== 'object') return []
  const units: Unit[] = []
  const loose: Field[] = []

  const visit = (list: Field[]) => {
    for (const field of list as any[]) {
      if (field.type === 'row' || field.type === 'collapsible') {
        visit(field.fields)
        continue
      }
      if (field.type === 'tabs') {
        for (const tab of field.tabs as Tab[]) {
          if (skipTab(tab)) continue
          units.push(
            ...collectUnits(tab.fields, tabData(tab, data), ctx, {
              key: `tab:${tabKey(tab)}`,
              heading: labelText(tab.label) || humanize(tabKey(tab)),
            }),
          )
        }
        continue
      }

      const name: string | undefined = field.name
      if (!name || skipField(name, ctx)) continue
      const value = data[name]

      if (field.type === 'blocks' && Array.isArray(value)) {
        for (const block of value) {
          const config = findBlock(field, block?.blockType, ctx)
          if (!config) continue
          units.push({
            key: `block:${block.id || `${name}-${units.length}`}`,
            heading: blockHeading(block, config),
            parts: fieldText(config.fields, block, ctx),
            anchor: typeof block.anchorId === 'string' ? block.anchorId : undefined,
            raw: block,
          })
        }
        continue
      }

      if (field.type === 'richText' && value) {
        const text = lexicalToText(value)
        if (text.length > MAX_SECTION_CHARS) {
          units.push(...richTextUnits(`rt:${name}`, value, rest.heading))
          continue
        }
      }

      loose.push(field)
    }
  }

  visit(fields)

  const parts = fieldText(loose, data, ctx)
  if (parts.length) units.unshift({ key: rest.key, heading: rest.heading, parts })
  return units
}

/** Cuts one over-long paragraph at sentence ends, or spaces, into pieces that fit. */
const splitLong = (text: string): string[] => {
  const pieces: string[] = []
  let rest = text
  while (rest.length > MAX_SECTION_CHARS) {
    const window = rest.slice(0, MAX_SECTION_CHARS)
    let cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('\n'))
    if (cut < MAX_SECTION_CHARS / 2) cut = window.lastIndexOf(' ')
    if (cut < MAX_SECTION_CHARS / 2) cut = MAX_SECTION_CHARS - 1
    pieces.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1).trim()
  }
  if (rest) pieces.push(rest)
  return pieces
}

/** Packs paragraphs into sections no longer than MAX_SECTION_CHARS. */
const toSections = (unit: Unit): RagSection[] => {
  const chunks: string[][] = [[]]
  let size = 0
  for (const part of unit.parts.flatMap(splitLong)) {
    if (size + part.length > MAX_SECTION_CHARS && chunks[chunks.length - 1].length) {
      chunks.push([])
      size = 0
    }
    chunks[chunks.length - 1].push(part)
    size += part.length + 1
  }
  return chunks
    .map((c, i) => ({
      key: i === 0 ? unit.key : `${unit.key}#${i + 1}`,
      heading: i === 0 ? unit.heading : `${unit.heading} (part ${i + 1})`,
      body: clean(c.join('\n')),
      anchor: unit.anchor,
      raw: unit.raw,
    }))
    .filter((s) => s.body.length >= MIN_SECTION_CHARS)
}

export const projectDoc = (
  fields: Field[],
  doc: any,
  opts: { getBlock: BlockLookup; omit?: string[] },
): RagSection[] => {
  const ctx: Ctx = { getBlock: opts.getBlock, omit: new Set(opts.omit || []) }
  const units = collectUnits(fields, doc, ctx, { key: 'overview', heading: 'Overview' })

  // Two blocks can share a key only if ids are missing; keep keys unique.
  const seen = new Map<string, number>()
  return units.flatMap(toSections).map((s) => {
    const n = seen.get(s.key) || 0
    seen.set(s.key, n + 1)
    return n ? { ...s, key: `${s.key}~${n + 1}` } : s
  })
}
