import type { BasePayload, CollectionSlug, Field, Tab } from 'payload'

import { stripForVisitors } from '../collections/Customers'
import { entryPath, getContentCollection, hubPath, type ContentCollectionEntry } from '../content/registry'
import { projectDoc } from './serialize'
import type { RagSection, RagSource } from './types'

/**
 * Knowledge base sources for content collections built on the factory and
 * for hubs (foundation.md section 7.3). sources.ts finds them by slug, so a
 * new collection with the kbase group is included without editing it.
 *
 * Each tab is one section, in order of weight: Knowledge base (kbAnswer,
 * kbFacts, then questions and synonyms), FAQ, Detail (description), then the
 * collection's own tabs in their admin order. The relationships the
 * collection lists in kb.resolve are sent as names, at the end of the first
 * section. Never sent: the SEO and WhatsApp tabs, the layout, media, links,
 * dates (the walker in serialize.ts skips all but the layout).
 *
 * Sections arrive in NCX post content as Awaiting Approval, as for
 * integrations (ncx-sync.md).
 */

const published = (d: any) => d?._status === 'published'

/** Tabs by label, heaviest first. Tabs not listed follow, in admin order. */
const WEIGHT = ['Knowledge base', 'FAQ', 'Detail']

/** Section headings the bot reads better than admin tab labels. */
const HEADINGS: Record<string, string> = {
  'Knowledge base': 'About',
  FAQ: 'Questions',
  Detail: 'Detail',
  Card: 'In short',
  Panel: 'How it works',
  Page: 'More detail',
}

/** Fields that only shape the page. */
const NEVER = ['layout', 'usePageDefaults', 'defaultLayout']

/** What a visitor receives, for collections that strip fields after a read. */
const VISITOR_VIEW: Partial<Record<string, (doc: any) => any>> = { customers: stripForVisitors }

const humanize = (s: string) =>
  s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase())

/** A named field anywhere in the config: top level, tabs, rows, collapsibles. */
const findField = (fields: Field[], name: string): any => {
  for (const f of fields as any[]) {
    if (f.name === name) return f
    const nested =
      f.type === 'tabs'
        ? (f.tabs as Tab[]).flatMap((t) => ('name' in t && t.name ? [] : t.fields))
        : f.type === 'row' || f.type === 'collapsible'
          ? f.fields
          : null
    const found = nested && findField(nested, name)
    if (found) return found
  }
  return null
}

const idOf = (v: any): string | null =>
  v && typeof v === 'object' ? (v.value !== undefined ? idOf(v.value) : v.id ? String(v.id) : null) : v ? String(v) : null

/**
 * The names a visitor would see for each relationship in `resolve`, as
 * "Label: a, b." lines. Each related collection is read without access
 * override, so a draft, a Planned entry or a hidden customer name is never
 * sent. Order follows the relationship.
 */
export const resolvedNames = async (
  payload: BasePayload,
  fields: Field[],
  doc: any,
  resolve: string[],
): Promise<string[]> => {
  const lines: string[] = []
  for (const name of resolve) {
    const field = findField(fields, name)
    if (!field || !['relationship', 'upload'].includes(field.type)) continue
    const values = Array.isArray(doc?.[name]) ? doc[name] : doc?.[name] ? [doc[name]] : []
    // Polymorphic values carry their own collection; plain ones use relationTo.
    const byCollection = new Map<string, string[]>()
    for (const v of values) {
      const collection = v && typeof v === 'object' && v.relationTo ? v.relationTo : field.relationTo
      const id = idOf(v)
      if (typeof collection === 'string' && id) byCollection.set(collection, [...(byCollection.get(collection) ?? []), id])
    }
    const names = new Map<string, string>()
    for (const [collection, ids] of byCollection) {
      const found = await payload.find({
        collection: collection as CollectionSlug,
        where: { id: { in: ids } },
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: ids.length,
        pagination: false,
      })
      const view = VISITOR_VIEW[collection] ?? ((d: any) => d)
      for (const d of found.docs as any[]) {
        const shown = view(d)
        const label = shown?.name || shown?.title
        if (label) names.set(String(d.id), String(label))
      }
    }
    const ordered = values.map((v: any) => names.get(idOf(v) ?? '')).filter(Boolean)
    if (ordered.length) {
      const label = typeof field.label === 'string' ? field.label : humanize(name)
      lines.push(`${label}: ${ordered.join(', ')}.`)
    }
  }
  return lines
}

const tabLabelOf = (key: string) => key.replace(/^tab:/, '').replace(/#\d+$/, '')

const weightOf = (s: RagSection) => {
  const at = WEIGHT.indexOf(tabLabelOf(s.key))
  return at === -1 ? WEIGHT.length : at
}

/** Sections by weight (stable), with the headings the bot reads. */
const weighAndName = (sections: RagSection[]): RagSection[] =>
  sections
    .map((s, i) => ({ s, i }))
    .sort((a, b) => weightOf(a.s) - weightOf(b.s) || a.i - b.i)
    .map(({ s }) => {
      const label = tabLabelOf(s.key)
      return HEADINGS[label] ? { ...s, heading: s.heading.replace(label, HEADINGS[label]) } : s
    })

/** An entry's sections: weighted, renamed, with its resolved relationships. */
export const serializeEntry = async (
  payload: BasePayload,
  entry: ContentCollectionEntry,
  doc: any,
): Promise<RagSection[]> => {
  const fields = (payload.collections as any)[entry.slug].config.fields as Field[]
  const sections = weighAndName(
    projectDoc(fields, doc, {
      getBlock: (slug) => (payload.blocks as any)?.[slug],
      omit: [...NEVER, ...entry.kb.exclude],
    }),
  )

  const names = await resolvedNames(payload, fields, doc, entry.kb.resolve)
  if (!names.length) return sections
  const about = sections.find((s) => s.key === 'tab:Knowledge base')
  if (about) {
    about.body = [about.body, ...names].join('\n')
    return sections
  }
  return [{ key: 'tab:Knowledge base', heading: 'About', body: names.join('\n') }, ...sections]
}

/** The source for a registered content collection with the kbase group, or undefined. */
export const contentRagSource = (slug: string): RagSource | undefined => {
  const entry = getContentCollection(slug)
  if (!entry?.kbase) return undefined
  return {
    collection: slug as CollectionSlug,
    shouldIndex: (d) => published(d) && ['live', 'pilot'].includes(d?.status) && d.includeInKbase !== false,
    // Every section title carries it, so the bot never presents a pilot as live.
    titleOf: (d) => (d.status === 'pilot' ? `${d.name} (in pilot)` : d.name),
    urlOf: (d) => entryPath(entry, d) ?? hubPath(entry) ?? '/',
    serialize: (payload, doc) => serializeEntry(payload, entry, doc),
  }
}

/** The tabs a hub sends: what the hub is, and its FAQ. */
const HUB_TABS = ['Knowledge base', 'FAQ']

/**
 * Hubs: the hub record's kbAnswer, kbFacts (with questions and synonyms) and
 * FAQ, under the hub's name, so "What is the bot swarm?" has an answer.
 */
export const hubRagSource: RagSource = {
  collection: 'hubs' as CollectionSlug,
  shouldIndex: (d) => published(d) && d.includeInKbase !== false,
  titleOf: (d) => d.name,
  urlOf: (d) => getContentCollection(d.forCollection)?.route ?? '/',
  serialize: async (payload, doc) => {
    const fields = (payload.collections as any).hubs.config.fields as Field[]
    const tabs = fields.find((f: any) => f.type === 'tabs') as { tabs: Tab[] } | undefined
    const kept: Field[] = [
      {
        type: 'tabs',
        tabs: (tabs?.tabs ?? []).filter((t) => HUB_TABS.includes(String(t.label))),
      } as Field,
    ]
    return weighAndName(projectDoc(kept, doc, { getBlock: () => undefined }))
  },
}
