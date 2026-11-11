import type { Block, PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { compareWithLivePath } from './compareLink'

import { previewUrl } from '../utilities/generatePreviewPath'
import { CONTENT_EVENTS } from './ContentEvents'
import { summariseChange } from './summary'

export const HISTORY_PAGE_SIZE = 20

export type HistoryKind = 'published' | 'draft' | 'session' | 'rollback' | 'unpublished'

export type HistoryEntry = {
  /** The version's id, or the event's for an unpublish. */
  key: string
  kind: HistoryKind
  versionId: string | null
  at: string
  /** An editing session's first save. */
  startedAt: string | null
  by: string
  /** The version visitors see now. */
  live: boolean
  /** The newest version, when it is not the live one. */
  currentDraft: boolean
  /** Was live at some point, even if a later unpublish rewrote its status. */
  wasPublished: boolean
  rolledBackFromAt: string | null
  changes: string[]
  previewUrl: string | null
}

export type HistoryPage = {
  entries: HistoryEntry[]
  page: number
  hasMore: boolean
  /** Payload's comparison of the newest version against the live one, when both exist and differ. */
  compareWithLive: string | null
}

type Version = {
  id: string
  createdAt: string
  updatedAt: string
  autosave?: boolean
  version: Record<string, unknown> & { _status?: string; updatedBy?: string | null; rolledBackFrom?: string | null }
}

type Event = { id: string; action: string; user?: string | null; version?: string | null; createdAt: string }

/** How each collection's History builds a preview link: from the entry's own Preview, or a path for a version. */
export type HistoryPreview = { path?: (doc: Record<string, unknown>) => string | null | undefined }

/** The website's preview link for one version: the usual preview link, plus which version to show. */
export const withVersion = (url: string, collection: string, versionId: string, at: string): string => {
  try {
    const u = new URL(url)
    u.searchParams.set('version', `${collection}:${versionId}`)
    u.searchParams.set('versionAt', at)
    return u.toString()
  } catch {
    return url
  }
}

const NOT_RECORDED = 'Not recorded'
const SYSTEM = 'System'

/**
 * One page of an entry's History, newest first: every version with who saved
 * it, what changed since the version before, and whether it is live; plus
 * the unpublish events that versions do not keep. Reads with the editor's
 * own access, so it shows only what they may read.
 */
export const buildHistory = async ({
  req,
  collection,
  id,
  page = 1,
  preview,
}: {
  req: PayloadRequest
  collection: SanitizedCollectionConfig
  id: string
  page?: number
  preview?: HistoryPreview
}): Promise<HistoryPage> => {
  const slug = collection.slug
  const want = page * HISTORY_PAGE_SIZE
  // One extra, older version, so the oldest shown has something to compare with.
  const found = await req.payload.findVersions({
    collection: slug as any,
    where: { parent: { equals: id } },
    sort: '-updatedAt',
    limit: want + 1,
    depth: 0,
    pagination: false,
    overrideAccess: false,
    req,
  })
  const all = found.docs as unknown as Version[]
  const shown = all.slice((page - 1) * HISTORY_PAGE_SIZE, want)
  const hasMore = all.length > want

  const stored = await req.payload.db.findOne<{ id: string; _status?: string }>({
    collection: slug,
    where: { id: { equals: id } },
    req,
  })
  const liveId = stored?._status === 'published' ? all.find((v) => v.version._status === 'published')?.id : undefined

  const events = (
    await req.payload.find({
      collection: CONTENT_EVENTS as any,
      where: { and: [{ collectionSlug: { equals: slug } }, { doc: { equals: String(id) } }] },
      sort: '-createdAt',
      limit: 500,
      depth: 0,
      overrideAccess: false,
      req,
    })
  ).docs as unknown as Event[]
  const publishedVersions = new Set(events.filter((e) => e.action === 'published' && e.version).map((e) => String(e.version)))
  // The admin's Unpublish saves a new draft version: that version is the unpublish.
  const unpublishedVersions = new Set(
    events.filter((e) => e.action === 'unpublished' && e.version).map((e) => String(e.version)),
  )

  const userIds = new Set<string>()
  for (const v of shown) if (v.version.updatedBy) userIds.add(String(v.version.updatedBy))
  for (const e of events) if (e.user) userIds.add(String(e.user))
  const users = userIds.size
    ? (
        await req.payload.find({
          collection: 'users',
          where: { id: { in: [...userIds] } },
          limit: userIds.size,
          depth: 0,
          overrideAccess: false,
          req,
        })
      ).docs
    : []
  const nameOf = (userId: unknown): string => {
    if (userId === undefined) return NOT_RECORDED
    if (!userId) return SYSTEM
    const u = users.find((x) => String(x.id) === String(userId)) as { name?: string; email?: string } | undefined
    return u?.name || u?.email || 'A removed user'
  }

  const blocks = Object.fromEntries(
    (req.payload.config.blocks || []).map((b) => [b.slug, b as Block]),
  ) as Record<string, Block>

  const fromDates = new Map<string, string>()
  for (const v of all) fromDates.set(String(v.id), v.updatedAt)
  const missingFrom = shown
    .map((v) => v.version.rolledBackFrom)
    .filter((f): f is string => Boolean(f) && !fromDates.has(String(f)))
  for (const f of missingFrom) {
    try {
      const v = (await req.payload.findVersionByID({
        collection: slug as any,
        id: f,
        depth: 0,
        overrideAccess: false,
        req,
      })) as unknown as Version
      if (v?.updatedAt) fromDates.set(f, v.updatedAt)
    } catch {
      // The version it came from has gone; the entry still says it was a rollback.
    }
  }

  const basePreview = await previewBase({ req, collection, id, preview })

  const entries: HistoryEntry[] = shown.map((v, i) => {
    const older = all[(page - 1) * HISTORY_PAGE_SIZE + i + 1]
    const status = v.version._status
    const wasPublished = status === 'published' || publishedVersions.has(String(v.id))
    const kind: HistoryKind = v.version.rolledBackFrom
      ? 'rollback'
      : wasPublished
        ? 'published'
        : unpublishedVersions.has(String(v.id))
          ? 'unpublished'
          : v.autosave
            ? 'session'
            : 'draft'
    const live = String(v.id) === String(liveId)
    const ownPath = preview?.path?.(v.version)
    const link = ownPath ? previewUrl(ownPath) : basePreview
    const changes = summariseChange(collection.fields, older?.version, v.version, blocks)
    return {
      key: String(v.id),
      kind,
      versionId: String(v.id),
      at: v.updatedAt,
      startedAt: kind === 'session' && v.createdAt !== v.updatedAt ? v.createdAt : null,
      by: nameOf('updatedBy' in v.version ? v.version.updatedBy : undefined),
      live,
      currentDraft: page === 1 && i === 0 && !live && status !== 'published' && kind !== 'unpublished',
      wasPublished,
      rolledBackFromAt: v.version.rolledBackFrom ? (fromDates.get(String(v.version.rolledBackFrom)) ?? null) : null,
      // An unpublish only changes the status.
      changes: kind === 'unpublished' && changes[0] === 'No content changes' ? [] : changes,
      previewUrl: link ? withVersion(link, slug, String(v.id), v.updatedAt) : null,
    }
  })

  // A save with no content change, by the same editor seconds after the one
  // before (a page is saved again straight after it is created, for its
  // breadcrumbs), is one entry: the newer keeps its place and takes the
  // older's summary.
  for (let i = entries.length - 2; i >= 0; i--) {
    const newer = entries[i]
    const older = entries[i + 1]
    if (
      newer.changes.length === 1 &&
      newer.changes[0] === 'No content changes' &&
      newer.kind === older.kind &&
      newer.kind !== 'rollback' &&
      newer.by === older.by &&
      Math.abs(Date.parse(newer.at) - Date.parse(older.at)) < 5000
    ) {
      newer.changes = older.changes
      newer.wasPublished ||= older.wasPublished
      entries.splice(i + 1, 1)
    }
  }

  // Unpublishes in the span this page covers that are not a version of their
  // own (one written over the live version in place, as Payload does when
  // unpublishing all locales).
  const newest = page === 1 ? Infinity : Date.parse(all[(page - 1) * HISTORY_PAGE_SIZE - 1]?.updatedAt ?? '')
  const oldest = hasMore ? Date.parse(shown[shown.length - 1]?.updatedAt ?? '') : -Infinity
  const asVersions = new Set(entries.filter((e) => e.kind === 'unpublished').map((e) => e.versionId))
  for (const e of events) {
    if (e.action !== 'unpublished' || (e.version && asVersions.has(String(e.version)))) continue
    const t = Date.parse(e.createdAt)
    if (!(t <= newest && t >= oldest)) continue
    entries.push({
      key: `event-${e.id}`,
      kind: 'unpublished',
      versionId: null,
      at: e.createdAt,
      startedAt: null,
      by: nameOf(e.user ?? null),
      live: false,
      currentDraft: false,
      wasPublished: false,
      rolledBackFromAt: null,
      changes: [],
      previewUrl: null,
    })
  }
  entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  const compareWithLive = page === 1 ? await compareWithLivePath(req, slug, id) : null
  return { entries, page, hasMore, compareWithLive }
}

/** The entry's own preview link (the Preview button's), for collections that have one. */
const previewBase = async ({
  req,
  collection,
  id,
  preview,
}: {
  req: PayloadRequest
  collection: SanitizedCollectionConfig
  id: string
  preview?: HistoryPreview
}): Promise<string | null> => {
  const own = collection.admin?.preview
  if (preview?.path || typeof own !== 'function') return null
  try {
    const current = await req.payload.findByID({
      collection: collection.slug as any,
      id,
      depth: 0,
      draft: true,
      overrideAccess: false,
      req,
    })
    const url = await own(current as Record<string, unknown>, { locale: req.locale ?? 'en', req, token: undefined as any })
    return typeof url === 'string' && url ? url : null
  } catch {
    return null
  }
}
