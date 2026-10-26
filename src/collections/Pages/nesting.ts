import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  PayloadRequest,
  RelationshipFieldSingleValidation,
  TextFieldSingleValidation,
  Where,
} from 'payload'
import { relationship, text } from 'payload/shared'

import { revalidateContent } from '../../content/revalidate'

/**
 * Pillar and cluster pages. A page may sit under one parent page (its
 * pillar), one level deep, and its path becomes the parent's slug plus its
 * own: /higher-education/student-lead-qualification. A page with no parent
 * keeps its path exactly as before: /{slug}, and / for the home page.
 *
 * The nested docs plugin (src/plugins/index.ts) stores each page's
 * breadcrumbs, with pagePath() building every URL in them.
 */

export const ONE_LEVEL_MESSAGE = 'Cluster pages sit directly under a pillar page.'
export const HAS_CLUSTERS_MESSAGE =
  'This page has cluster pages under it, so it cannot sit under another page. Move its cluster pages first.'

type Slugged = { slug?: string | null }
type PageLike = Slugged & {
  id?: string | number
  parent?: unknown
  breadcrumbs?: { url?: string | null }[] | null
}

const idOf = (v: unknown): string | null => {
  if (v && typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id)
  return typeof v === 'string' || typeof v === 'number' ? String(v) : null
}

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

const findPage = async (req: PayloadRequest, id: string): Promise<PageLike | null> =>
  (await req.payload.findByID({
    collection: 'pages',
    id,
    depth: 0,
    draft: false,
    disableErrors: true,
    overrideAccess: true,
    req,
  })) as PageLike | null

/** The path a page has with its current parent, read from the database. */
export const resolvePagePath = async (req: PayloadRequest, doc: PageLike): Promise<string> => {
  const parentId = idOf(doc.parent)
  if (!parentId) return pagePath([doc])
  const parent =
    doc.parent && typeof doc.parent === 'object' && 'slug' in doc.parent
      ? (doc.parent as PageLike)
      : await findPage(req, parentId)
  return parent ? pagePath([parent, doc]) : pagePath([doc])
}

const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * The parent field: one level only. A parent that has a parent of its own
 * is refused, and so is giving a parent to a page that already has cluster
 * pages under it. A custom validate replaces Payload's own, so the standard
 * relationship check (which also applies the parent filter) runs after.
 */
export const validateParent: RelationshipFieldSingleValidation = async (value, options) => {
  const { req, id } = options
  const parentId = idOf(value)
  if (parentId) {
    const parent = await findPage(req, parentId)
    if (parent && idOf(parent.parent)) return ONE_LEVEL_MESSAGE
    if (id) {
      const clusters = await req.payload.count({
        collection: 'pages',
        where: { parent: { equals: id } },
        overrideAccess: true,
        req,
      })
      if (clusters.totalDocs > 0) return HAS_CLUSTERS_MESSAGE
    }
  }
  return relationship(value, options)
}

/**
 * The primary keyword: no two pages may share one, compared without regard
 * to case or spacing. Checked against every page's latest version, drafts
 * included, so two pages in progress cannot claim the same keyword either.
 */
export const validatePrimaryKeyword: TextFieldSingleValidation = async (value, options) => {
  const base = text(value, options)
  if (base !== true) return base
  if (typeof value !== 'string' || !value.trim()) return true
  const { req, id } = options
  const wanted = normalise(value)
  const where: Where = {
    and: [
      { 'meta.primaryKeyword': { like: value.trim() } },
      ...(id ? [{ id: { not_equals: id } }] : []),
    ],
  }
  const { docs } = await req.payload.find({
    collection: 'pages',
    where,
    draft: true,
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    req,
  })
  const other = docs.find(
    (d) => typeof d.meta?.primaryKeyword === 'string' && normalise(d.meta.primaryKeyword) === wanted,
  )
  if (!other) return true
  return `"${value.trim()}" is already the primary keyword of the page "${other.title}" (${await resolvePagePath(req, other as PageLike)}). Choose a different keyword.`
}

type PathChange = { from: string; pillar: string | null; pillarId: string | null }
const CONTEXT_KEY = 'pagePathBeforePublish'

/**
 * Before a publish: note the path the page has on the live site now, from
 * its published version. Draft saves leave the live page alone, so they are
 * skipped, and so is a page that has never been published.
 */
export const notePublishedPath: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || data?._status !== 'published' || !originalDoc?.id) return data
  const live = await findPage(req, String(originalDoc.id))
  if (!live || (live as { _status?: string })._status !== 'published') return data
  // The stored breadcrumbs hold the path as it was last saved. A cluster whose
  // pillar was just renamed is re-saved after the pillar, so its parent's slug
  // has already changed; the breadcrumbs still have the old path.
  const stored = live.breadcrumbs?.at(-1)?.url
  const from = typeof stored === 'string' && stored ? stored : await resolvePagePath(req, live)
  const notes = ((req.context[CONTEXT_KEY] as Record<string, PathChange>) ??= {})
  notes[String(originalDoc.id)] = { from, pillar: await pillarPath(req, live), pillarId: idOf(live.parent) }
  return data
}

/** The path of a page's pillar, or null for a page without a parent. */
export const pillarPath = async (req: PayloadRequest, doc: PageLike): Promise<string | null> => {
  const parentId = idOf(doc.parent)
  if (!parentId) return null
  const parent = await findPage(req, parentId)
  return parent ? pagePath([parent]) || null : null
}

/**
 * After a publish that moved the page: a redirect from the old path to the
 * new one. Redirects that led to the old path are pointed at the new one, so
 * there is never a chain, and any redirect away from the new path is removed,
 * since the page now lives there.
 */
export const redirectMovedPage: CollectionAfterChangeHook = async ({ doc, req }) => {
  const note = (req.context[CONTEXT_KEY] as Record<string, PathChange> | undefined)?.[String(doc.id)]
  if (!note || doc._status !== 'published') return doc

  const from = note.from
  const to = await resolvePagePath(req, doc as PageLike)
  // The home page is served at / whatever its slug, so it never moves; a page
  // with no slug has no address to redirect from or to.
  if (!from || !to || from === to || from === '/' || to === '/') return doc

  const base = { overrideAccess: true, req, depth: 0 } as const
  const to_ = { type: 'custom' as const, url: to }

  const awayFromNew = await req.payload.find({ ...base, collection: 'redirects', where: { from: { equals: to } }, limit: 10 })
  for (const r of awayFromNew.docs) await req.payload.delete({ ...base, collection: 'redirects', id: r.id })

  const intoOld = await req.payload.find({ ...base, collection: 'redirects', where: { 'to.url': { equals: from } }, limit: 100 })
  for (const r of intoOld.docs) {
    if (r.from === to) continue
    await req.payload.update({ ...base, collection: 'redirects', id: r.id, data: { to: to_ } })
  }

  const existing = await req.payload.find({ ...base, collection: 'redirects', where: { from: { equals: from } }, limit: 1 })
  if (existing.docs[0]) {
    await req.payload.update({ ...base, collection: 'redirects', id: existing.docs[0].id, data: { to: to_ } })
  } else {
    await req.payload.create({ ...base, collection: 'redirects', data: { from, to: to_ } })
  }
  req.payload.logger.info(`Page moved: redirect from ${from} to ${to}`)
  return doc
}

// The website takes at most 50 paths in one call (api/revalidate).
const MAX_PATHS = 50

const unique = (paths: (string | null | undefined)[]): string[] =>
  [...new Set(paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/')))].slice(0, MAX_PATHS)

/**
 * The paths of the published pages under a pillar, so their "Next stage"
 * links follow when one of them is published, moved or taken down.
 */
export const clusterPaths = async (req: PayloadRequest, pillarId: string | null): Promise<string[]> => {
  if (!pillarId) return []
  const { docs } = await req.payload.find({
    collection: 'pages',
    where: { and: [{ parent: { equals: pillarId } }, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: MAX_PATHS,
    overrideAccess: true,
    pagination: false,
    req,
  })
  const paths: string[] = []
  for (const d of docs as PageLike[]) {
    const stored = d.breadcrumbs?.at(-1)?.url
    paths.push(typeof stored === 'string' && stored ? stored : await resolvePagePath(req, d))
  }
  return paths
}

/**
 * afterChange: asks the website to refresh what a visitor sees
 * (src/content/revalidate.ts). When the page is published now, or was before
 * this change: its path and its pillar's, and the path and pillar it had on
 * the live site before, so a move clears the old address and the old pillar
 * too. Also every other published cluster page under those pillars, whose
 * "Next stage" link may lead to this page. Draft saves that follow a draft change nothing live and are skipped.
 * Runs last: it also clears the note notePublishedPath left.
 */
export const revalidatePageOnSite: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const notes = req.context[CONTEXT_KEY] as Record<string, PathChange> | undefined
  const note = notes?.[String(doc.id)]
  if (notes) delete notes[String(doc.id)]
  if (req.context?.disableRevalidate) return doc
  const now = doc?._status === 'published'
  const before = previousDoc?._status === 'published'
  if (!now && !before && !note) return doc
  // Every pillar the page sits under now or sat under before, for its other
  // cluster pages: their "Next stage" links may point at this page.
  const pillars = [...new Set([
    now ? idOf((doc as PageLike).parent) : null,
    note?.pillarId ?? null,
    before ? idOf((previousDoc as PageLike).parent) : null,
  ].filter((id): id is string => Boolean(id)))]
  const siblings = (await Promise.all(pillars.map((id) => clusterPaths(req, id)))).flat()
  await revalidateContent({
    collection: 'pages',
    paths: unique([
      now ? await resolvePagePath(req, doc as PageLike) : null,
      now ? await pillarPath(req, doc as PageLike) : null,
      note?.from,
      note?.pillar,
      before ? await resolvePagePath(req, previousDoc as PageLike) : null,
      before ? await pillarPath(req, previousDoc as PageLike) : null,
      ...siblings,
    ]),
    reason: now ? 'published or updated' : 'unpublished',
    logger: req.payload?.logger,
  })
  return doc
}

/** afterDelete: the path the page had, its pillar's, and its other cluster pages. */
export const revalidateDeletedPageOnSite: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.disableRevalidate || doc?._status !== 'published') return doc
  const stored = (doc as PageLike).breadcrumbs?.at(-1)?.url
  await revalidateContent({
    collection: 'pages',
    paths: unique([
      stored || (await resolvePagePath(req, doc as PageLike)),
      await pillarPath(req, doc as PageLike),
      ...(await clusterPaths(req, idOf((doc as PageLike).parent))),
    ]),
    reason: 'deleted',
    logger: req.payload?.logger,
  })
  return doc
}
