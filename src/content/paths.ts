import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  FieldHook,
  PayloadRequest,
  TextField,
  TextFieldSingleValidation,
  Where,
} from 'payload'
import { ValidationError } from 'payload'
import { text } from 'payload/shared'

import { contentCollections, entryPath, hubPagePath, type ContentCollectionEntry } from './registry'

/**
 * Site addresses shared by CMS pages and content collection entries: each
 * record's path, the check that no two records claim one, the primary
 * keyword check across all of them, and the redirect left when a published
 * record moves.
 *
 * A page lives at /{slug} (the home page at /), or at /{pillar}/{slug} under
 * a pillar page (src/collections/Pages/nesting.ts). An entry lives where its
 * collection's route puts it (registry.ts, ContentRouting): {route}/{slug},
 * /{slug}, or /{parent slug}/{slug}.
 */

type Doc = Record<string, any>
type Slugged = { slug?: string | null }
type PageLike = Slugged & { id?: string | number; parent?: unknown; breadcrumbs?: { url?: string | null }[] | null }

export const idOf = (v: unknown): string | null => {
  if (v && typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id)
  return typeof v === 'string' || typeof v === 'number' ? String(v) : null
}

export const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

const findById = async (req: PayloadRequest, collection: string, id: string): Promise<Doc | null> =>
  (await req.payload.findByID({
    collection: collection as CollectionSlug,
    id,
    depth: 0,
    draft: false,
    disableErrors: true,
    overrideAccess: true,
    req,
  })) as Doc | null

/* Pages */

/**
 * A page's path from its chain of pages, pillar first: "/" for the home
 * page on its own, otherwise every slug joined, as /pillar/cluster. Empty
 * while any page in the chain has no slug yet, since it has no address.
 */
export const pagePath = (docs: Slugged[]): string => {
  if (!docs.length || docs.some((d) => typeof d?.slug !== 'string' || !d.slug)) return ''
  if (docs.length === 1 && docs[0].slug === 'home') return '/'
  return '/' + docs.map((d) => d.slug).join('/')
}

export const findPage = (req: PayloadRequest, id: string) => findById(req, 'pages', id) as Promise<PageLike | null>

/** The path a page has with its current parent, read from the database. */
export const resolvePagePath = async (req: PayloadRequest, doc: PageLike): Promise<string> => {
  const parentId = idOf(doc.parent)
  if (!parentId) return pagePath([doc])
  const parent =
    doc.parent && typeof doc.parent === 'object' && 'slug' in doc.parent ? (doc.parent as PageLike) : await findPage(req, parentId)
  return parent ? pagePath([parent, doc]) : pagePath([doc])
}

/** A saved page's path: its stored breadcrumbs, else worked out from its parent. */
export const savedPagePath = async (req: PayloadRequest, doc: PageLike): Promise<string> => {
  const stored = doc.breadcrumbs?.at(-1)?.url
  return typeof stored === 'string' && stored ? stored : resolvePagePath(req, doc)
}

/* Entries */

/**
 * An entry's address from its collection's routing, its slug and (for
 * entries under a parent) the parent entry's slug. Null without an own page,
 * or while the slug or the parent is missing.
 */
export const computeEntryPath = async (req: PayloadRequest, entry: ContentCollectionEntry, doc: Doc): Promise<string | null> => {
  const slug = typeof doc.slug === 'string' && doc.slug ? doc.slug : null
  if (!slug || !doc.hasOwnPage) return null
  const r = entry.routing
  if (r.kind === 'base') return `${r.base}/${slug}`
  if (r.kind === 'root') return `/${slug}`
  if (r.kind === 'parent') {
    const link = doc[r.field]
    const parentId = idOf(link)
    if (!parentId) return null
    const parent = link && typeof link === 'object' && 'slug' in link ? link : await findById(req, r.collection, parentId)
    return typeof parent?.slug === 'string' && parent.slug ? `/${parent.slug}/${slug}` : null
  }
  return null
}

/* Who already has an address */

export type Owner = { what: string; title: string }

const singular = (entry: ContentCollectionEntry) => `the ${entry.label.singular.toLowerCase()}`

/**
 * The record that already has this address: a page, an entry in any
 * registered collection, or a collection's hub page. `self` is left out.
 */
export const findPathOwner = async (
  req: PayloadRequest,
  path: string | null,
  self: { collection: string; id?: string | number | null },
): Promise<Owner | null> => {
  if (!path || path === '/') return null
  const isSelf = (collection: string, id: unknown) =>
    self.collection === collection && self.id != null && String(self.id) === String(id)
  const segments = path.split('/').filter(Boolean)
  const last = segments.at(-1)!
  const base = { depth: 0, overrideAccess: true, pagination: false, req } as const

  const pages = await req.payload.find({ ...base, collection: 'pages', where: { slug: { equals: last } }, limit: 10 })
  for (const p of pages.docs as Doc[]) {
    if (!isSelf('pages', p.id) && (await savedPagePath(req, p)) === path) return { what: 'the page', title: String(p.title) }
  }

  for (const entry of contentCollections()) {
    if (hubPagePath(entry) !== path) continue
    const hub = await req.payload.find({ ...base, collection: 'hubs', where: { forCollection: { equals: entry.slug } }, limit: 1 })
    return { what: 'the hub', title: String((hub.docs[0] as Doc | undefined)?.name ?? `${entry.label.plural} hub`) }
  }

  for (const entry of contentCollections()) {
    if (!entry.ownPage) continue
    const r = entry.routing
    let where: Where | null = null
    if (r.kind === 'root' || r.kind === 'parent') where = { path: { equals: path } }
    else if (r.kind === 'base' && path === `${r.base}/${last}`) where = { and: [{ slug: { equals: last } }, { hasOwnPage: { equals: true } }] }
    if (!where) continue
    const found = await req.payload.find({ ...base, collection: entry.slug as CollectionSlug, where, limit: 5 })
    const other = (found.docs as Doc[]).find((d) => !isSelf(entry.slug, d.id))
    if (other) return { what: singular(entry), title: String(other.name ?? other.title ?? other.slug) }
  }
  return null
}

export const pathClashMessage = (path: string, owner: Owner) =>
  `The address ${path} is already used by ${owner.what} "${owner.title}". Choose a different slug.`

/** Refuses the save, on the slug field, when another record has this address. */
const refuseClash = async (req: PayloadRequest, collection: string, id: unknown, path: string | null) => {
  const owner = await findPathOwner(req, path, { collection, id: id as string })
  if (owner && path) {
    throw new ValidationError({ collection, errors: [{ path: 'slug', message: pathClashMessage(path, owner) }] })
  }
}

/**
 * A hook for the slug field of Pages. Field hooks run after the slug is
 * generated from the title, so the path is the one this save will give.
 * Every save is checked, drafts included.
 */
export const pageSlugClashCheck: FieldHook = async ({ value, data, originalDoc, req }) => {
  const doc = { ...(originalDoc ?? {}), ...(data ?? {}), slug: value } as PageLike
  await refuseClash(req, 'pages', originalDoc?.id, await resolvePagePath(req, doc))
  return value
}

/**
 * The stored path of an entry: read only, set on every save from the slug
 * (and the parent entry), checked against every other address on the site.
 * Placed after the slug in the sidebar, so the slug is final by then.
 */
export const entryPathField = (entry: ContentCollectionEntry): TextField => ({
  name: 'path',
  type: 'text',
  label: 'Address (set on save)',
  index: true,
  admin: {
    position: 'sidebar',
    readOnly: true,
    description:
      entry.routing.kind === 'parent'
        ? 'This page on the site: the parent entry, then this slug. Updated on save and when the parent is renamed.'
        : 'This page on the site. Updated on save. Empty while Own page is off.',
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const doc = { ...(originalDoc ?? {}), ...(data ?? {}) }
        const path = await computeEntryPath(req, entry, doc)
        await refuseClash(req, entry.slug, originalDoc?.id, path)
        return path
      },
    ],
  },
})

/* Primary keyword */

type KeywordSource = { collection: string; what: string; title: (d: Doc) => string; path: (req: PayloadRequest, d: Doc) => Promise<string | null> }

const keywordSources = (): KeywordSource[] => [
  { collection: 'pages', what: 'the page', title: (d) => String(d.title), path: (req, d) => resolvePagePath(req, d) },
  ...contentCollections()
    .filter((e) => e.seo)
    .map((e) => ({
      collection: e.slug,
      what: singular(e),
      title: (d: Doc) => String(d.name),
      path: async (_req: PayloadRequest, d: Doc) => entryPath(e, d),
    })),
]

/** The page or entry that already has this primary keyword, ignoring case and spacing. */
export const findKeywordOwner = async (
  req: PayloadRequest,
  keyword: string,
  self: { collection: string; id?: string | number | null },
): Promise<(Owner & { path: string | null }) | null> => {
  const wanted = normalise(keyword)
  for (const source of keywordSources()) {
    const mine = self.collection === source.collection && self.id != null
    const { docs } = await req.payload.find({
      collection: source.collection as CollectionSlug,
      where: { and: [{ 'meta.primaryKeyword': { like: keyword.trim() } }, ...(mine ? [{ id: { not_equals: self.id } }] : [])] },
      draft: true,
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      req,
    })
    const other = (docs as Doc[]).find(
      (d) => typeof d.meta?.primaryKeyword === 'string' && normalise(d.meta.primaryKeyword) === wanted,
    )
    if (other) return { what: source.what, title: source.title(other), path: (await source.path(req, other)) || null }
  }
  return null
}

/**
 * meta.primaryKeyword on Pages and on every content collection's SEO tab:
 * no two records share one, across all of them. Checked on publish (Payload
 * does not validate draft saves).
 */
export const validatePrimaryKeyword: TextFieldSingleValidation = async (value, options) => {
  const base = text(value, options)
  if (base !== true) return base
  if (typeof value !== 'string' || !value.trim()) return true
  const owner = await findKeywordOwner(options.req, value, { collection: String(options.collectionSlug ?? ''), id: options.id })
  if (!owner) return true
  return `"${value.trim()}" is already the primary keyword of ${owner.what} "${owner.title}"${owner.path ? ` (${owner.path})` : ''}. Choose a different keyword.`
}

/* Redirects */

/**
 * A redirect from a record's old address to its new one. Redirects that led
 * to the old address are pointed at the new one, so there is never a chain,
 * and any redirect away from the new address is removed, since the record
 * now lives there. Nothing for the home page, or without both addresses.
 */
export const writeRedirect = async (req: PayloadRequest, from: string | null, to: string | null): Promise<boolean> => {
  if (!from || !to || from === to || from === '/' || to === '/') return false
  const base = { overrideAccess: true, req, depth: 0 } as const
  const target = { type: 'custom' as const, url: to }

  const awayFromNew = await req.payload.find({ ...base, collection: 'redirects', where: { from: { equals: to } }, limit: 10 })
  for (const r of awayFromNew.docs) await req.payload.delete({ ...base, collection: 'redirects', id: r.id })

  const intoOld = await req.payload.find({ ...base, collection: 'redirects', where: { 'to.url': { equals: from } }, limit: 100 })
  for (const r of intoOld.docs) {
    if (r.from === to) continue
    await req.payload.update({ ...base, collection: 'redirects', id: r.id, data: { to: target } })
  }

  const existing = await req.payload.find({ ...base, collection: 'redirects', where: { from: { equals: from } }, limit: 1 })
  if (existing.docs[0]) await req.payload.update({ ...base, collection: 'redirects', id: existing.docs[0].id, data: { to: target } })
  else await req.payload.create({ ...base, collection: 'redirects', data: { from, to: target } })
  req.payload.logger.info(`Moved: redirect from ${from} to ${to}`)
  return true
}

const ENTRY_NOTES = 'entryPathBeforePublish'
const noteKey = (collection: string, id: unknown) => `${collection}:${String(id)}`

/**
 * Before an entry is published: note the address it has on the live site
 * now, from its published version. Draft saves leave the live site alone,
 * and an entry never published has no address to move from.
 */
export const noteEntryLivePath =
  (entry: ContentCollectionEntry): CollectionBeforeChangeHook =>
  async ({ data, operation, originalDoc, req }) => {
    if (operation !== 'update' || data?._status !== 'published' || !originalDoc?.id) return data
    const live = await findById(req, entry.slug, String(originalDoc.id))
    if (live?._status !== 'published') return data
    const notes = ((req.context[ENTRY_NOTES] as Record<string, string | null>) ??= {})
    notes[noteKey(entry.slug, originalDoc.id)] = entryPath(entry, live)
    return data
  }

/** After an entry is published at a new address: the redirect from the old one. */
export const redirectMovedEntry =
  (entry: ContentCollectionEntry): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    const notes = req.context[ENTRY_NOTES] as Record<string, string | null> | undefined
    const key = noteKey(entry.slug, doc.id)
    if (!notes || !(key in notes)) return doc
    const from = notes[key]
    delete notes[key]
    if (doc._status === 'published') await writeRedirect(req, from, entryPath(entry, doc))
    return doc
  }

/**
 * After an entry is published: the entries in other collections that sit
 * under it (route { parent }) get their stored address again, so a renamed
 * parent moves them too. As the nested docs plugin does for pages, a child's
 * published version is saved again as it is, then any newer draft, so no
 * draft is published by this.
 */
export const refreshChildPaths =
  (entry: ContentCollectionEntry): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    if (doc?._status !== 'published') return doc
    const children = contentCollections().filter((c) => c.routing.kind === 'parent' && c.routing.collection === entry.slug)
    for (const child of children) {
      if (child.routing.kind !== 'parent') continue
      const where: Where = { [child.routing.field]: { equals: doc.id } }
      const base = { collection: child.slug as CollectionSlug, where, depth: 0, limit: 0, overrideAccess: true, pagination: false, req } as const
      const published = (await req.payload.find({ ...base, draft: false })).docs as Doc[]
      const latest = (await req.payload.find({ ...base, draft: true })).docs as Doc[]
      for (const live of published.filter((d) => d._status === 'published')) {
        const next = await computeEntryPath(req, child, { ...live, [child.routing.field]: doc })
        if (next === (live.path ?? null)) continue
        await req.payload.update({ collection: child.slug as CollectionSlug, id: live.id, data: live, draft: false, depth: 0, req })
      }
      for (const draft of latest.filter((d) => d._status === 'draft')) {
        const next = await computeEntryPath(req, child, { ...draft, [child.routing.field]: doc })
        if (next === (draft.path ?? null)) continue
        await req.payload.update({ collection: child.slug as CollectionSlug, id: draft.id, data: draft, draft: true, depth: 0, req })
      }
    }
    return doc
  }
