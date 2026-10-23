import type { BasePayload, CollectionSlug, Where } from 'payload'

import { cutOnWord } from '../collections/integrations/hooks'
import type { ContentCollectionEntry } from './registry'

/**
 * Ready-to-send WhatsApp messages for a content collection (foundation.md
 * section 7.4), as WhatsApp Cloud API message objects: the bot adds
 * messaging_product and to, and sends each one as it is.
 *
 * Every text is cut to the Cloud API limit on a whole word, so a message is
 * never refused, even if stored text is longer than its field allows.
 */

/** Cloud API limits (fields_reference.md, section 6). */
export const WA = {
  rows: 10,
  rowTitle: 24,
  rowDescription: 72,
  rowId: 200,
  sectionTitle: 24,
  listButton: 20,
  buttonLabel: 20,
  buttons: 3,
  header: 60,
  footer: 60,
  body: 1024,
} as const

type Doc = Record<string, any>

export type WaMessage =
  | { type: 'interactive'; interactive: Record<string, unknown> }
  | { type: 'text'; text: { body: string } }

export type WaResponse = {
  collection: string
  step: 'groups' | 'entries' | 'entry'
  /** False when the answer is the fallback: nothing matched. */
  found: boolean
  messages: WaMessage[]
}

/** Text cut to a limit on a whole word, or undefined when empty. */
export const fit = (text: unknown, max: number): string | undefined => {
  if (typeof text !== 'string') return undefined
  const t = text.trim()
  return t ? cutOnWord(t, max) : undefined
}

const first = (...values: unknown[]): string | undefined =>
  values.find((v): v is string => typeof v === 'string' && v.trim() !== '')

const DEFAULTS = {
  listButton: 'See options',
  intro: 'Choose one to find out more.',
  fallback: 'Sorry, that is not something I can show here. Please choose from the list again.',
  linkLabel: 'Read more',
} as const

/** The public site, for links: the same address the knowledge base sync uses. */
export const siteUrl = () => (process.env.NCX_SITE_URL || 'https://neuroncx.in').replace(/\/+$/, '')

const absolute = (link?: string | null): string | undefined => {
  if (!link) return undefined
  if (/^https:\/\//.test(link)) return link
  return link.startsWith('/') ? `${siteUrl()}${link}` : undefined
}

const listMessage = (opts: {
  header?: string
  body: string
  footer?: string
  button: string
  sectionTitle: string
  rows: { id: string; title?: string; description?: string }[]
}): WaMessage => ({
  type: 'interactive',
  interactive: {
    type: 'list',
    ...(opts.header ? { header: { type: 'text', text: fit(opts.header, WA.header) } } : {}),
    body: { text: fit(opts.body, WA.body) },
    ...(opts.footer ? { footer: { text: fit(opts.footer, WA.footer) } } : {}),
    action: {
      button: fit(opts.button, WA.listButton),
      sections: [
        {
          title: fit(opts.sectionTitle, WA.sectionTitle),
          rows: opts.rows
            .filter((r) => r.title)
            .slice(0, WA.rows)
            .map((r) => ({
              id: r.id.slice(0, WA.rowId),
              title: fit(r.title, WA.rowTitle),
              ...(r.description ? { description: fit(r.description, WA.rowDescription) } : {}),
            })),
        },
      ],
    },
  },
})

const textMessage = (body: string): WaMessage => ({ type: 'text', text: { body: fit(body, 4096) ?? body } })

/** The hub's fallback, sent whenever nothing matched. */
export const fallbackMessages = (hub: Doc | null): WaMessage[] => [
  textMessage(first(hub?.waFallback) ?? DEFAULTS.fallback),
]

/** Groupings as a list. Each row's id asks for that grouping's entries. */
export const groupsMessage = (
  entry: ContentCollectionEntry,
  hub: Doc | null,
  groups: Doc[],
): WaMessage =>
  listMessage({
    body: first(hub?.waIntro, hub?.subheading) ?? DEFAULTS.intro,
    button: first(hub?.waListButton) ?? DEFAULTS.listButton,
    sectionTitle: first(hub?.waSectionTitle, entry.label.plural) as string,
    rows: groups.map((g) => ({
      id: `entries:${g.slug}`,
      title: first(g.waRowTitle, g.name),
      description: first(g.waRowDescription, g.intro, g.painLine),
    })),
  })

/** Pilot entries say so wherever the bot shows them. */
const pilotNote = (doc: Doc, text?: string) =>
  doc.status === 'pilot' ? (text ? `In pilot. ${text}` : 'In pilot.') : text

/** Entries as a list, 10 at most. Each row's id asks for that entry. */
export const entriesMessage = (
  entry: ContentCollectionEntry,
  hub: Doc | null,
  group: Doc | null,
  docs: Doc[],
): WaMessage =>
  listMessage({
    header: group ? first(group.name) : undefined,
    body: first(group?.summary, group?.intro, hub?.waIntro, hub?.subheading) ?? DEFAULTS.intro,
    button: first(hub?.waListButton) ?? DEFAULTS.listButton,
    sectionTitle: first(group?.waRowTitle, group?.name, hub?.waSectionTitle, entry.label.plural) as string,
    rows: docs.map((d) => ({
      id: `entry:${d.slug}`,
      title: first(d.waRowTitle, d.name),
      description: pilotNote(d, first(d.waRowDescription, d.summary)),
    })),
  })

/**
 * One entry: header, body with the key points as lines, footer and up to
 * three reply buttons; then, when it has a link, a second message with a
 * link button, since the Cloud API does not mix reply and link buttons.
 */
export const entryMessages = (doc: Doc): WaMessage[] => {
  const points = (doc.waKeyPoints ?? [])
    .map((p: Doc) => first(p?.line))
    .filter(Boolean)
    .map((line: string) => `• ${line}`)
  const main = pilotNote(doc, first(doc.waBody, doc.summary, doc.kbAnswer)) ?? doc.name
  const body = [main, points.join('\n')].filter(Boolean).join('\n\n')
  const header = first(doc.waHeader, doc.name)
  const footer = first(doc.waFooter)
  const buttons = (doc.waButtons ?? [])
    .filter((b: Doc) => first(b?.label) && first(b?.action))
    .slice(0, WA.buttons)
    .map((b: Doc) => ({ type: 'reply', reply: { id: String(b.action).slice(0, 256), title: fit(b.label, WA.buttonLabel) } }))
  const link = absolute(doc.waLink)

  const parts = {
    ...(header ? { header: { type: 'text', text: fit(header, WA.header) } } : {}),
    body: { text: fit(body, WA.body) },
    ...(footer ? { footer: { text: fit(footer, WA.footer) } } : {}),
  }
  const messages: WaMessage[] = []
  if (buttons.length) {
    messages.push({ type: 'interactive', interactive: { type: 'button', ...parts, action: { buttons } } })
  }
  if (link) {
    const display = fit(first(doc.waLinkLabel) ?? DEFAULTS.linkLabel, WA.buttonLabel)
    messages.push({
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        // With reply buttons above, the link message only needs a short line.
        ...(buttons.length ? { body: { text: fit(header ?? doc.name, WA.body) } } : parts),
        action: { name: 'cta_url', parameters: { display_text: display, url: link } },
      },
    })
  }
  if (!messages.length) messages.push(textMessage(body))
  return messages
}

/* ------------------------------------------------------------------ */
/* Reading, as a visitor                                               */
/* ------------------------------------------------------------------ */

/**
 * Every read runs without access override and without a user, so the
 * endpoint can only ever return what a site visitor could read: published,
 * Live or Pilot entries, published hubs and groupings. The status filter is
 * repeated in the query as a second guard.
 */
const PUBLIC_ENTRY: Where = {
  and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
}

const read = async (payload: BasePayload, collection: string, where: Where, limit = 100) =>
  (
    await payload.find({
      collection: collection as CollectionSlug,
      where,
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit,
      sort: 'order',
      pagination: false,
    })
  ).docs as Doc[]

const byOrderThenName = (a: Doc, b: Doc) =>
  (a.order ?? 100) - (b.order ?? 100) || String(a.name).localeCompare(String(b.name))

export const loadHub = async (payload: BasePayload, collection: string): Promise<Doc | null> =>
  (await read(payload, 'hubs', { forCollection: { equals: collection } }, 1))[0] ?? null

export const loadEntries = async (payload: BasePayload, entry: ContentCollectionEntry, where?: Where) =>
  (await read(payload, entry.slug, where ? { and: [PUBLIC_ENTRY, where] } : PUBLIC_ENTRY)).sort(byOrderThenName)

export const loadEntry = async (payload: BasePayload, entry: ContentCollectionEntry, slug: string) =>
  (await read(payload, entry.slug, { and: [PUBLIC_ENTRY, { slug: { equals: slug } }] }, 1))[0] ?? null

/**
 * Groupings that have at least one public entry, so no row leads nowhere.
 * In the hub's Grouping sections order when it sets one, else their own.
 */
export const loadGroups = async (
  payload: BasePayload,
  entry: ContentCollectionEntry,
  hub: Doc | null,
): Promise<Doc[]> => {
  const grouping = entry.grouping!
  const groups = (await read(payload, 'lists', { type: { equals: grouping.listType } })).sort(byOrderThenName)
  const entries = await loadEntries(payload, entry)
  const used = new Set(entries.map((e) => String(e[grouping.field])))
  const live = groups.filter((g) => used.has(String(g.id)))
  const hubOrder = (hub?.groupingSections ?? []).map((r: Doc) => String(r.group?.id ?? r.group))
  if (!hubOrder.length) return live
  const rank = (g: Doc) => {
    const at = hubOrder.indexOf(String(g.id))
    return at === -1 ? hubOrder.length : at
  }
  return [...live].sort((a, b) => rank(a) - rank(b))
}

export const loadGroup = async (payload: BasePayload, entry: ContentCollectionEntry, slug: string) =>
  (
    await read(payload, 'lists', {
      and: [{ type: { equals: entry.grouping!.listType } }, { slug: { equals: slug } }],
    }, 1)
  )[0] ?? null
