import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type PayloadRequest,
} from 'payload'

import { CONTENT_EVENTS, type EventAction } from './ContentEvents'

/** Set on req.context while a rollback runs: the version it came from. */
export const ROLLBACK_FROM = 'historyRollbackFrom'

export const LIVE_ROLLBACK_REFUSED =
  'Rolling back is to a draft only. Use Roll back to this in History, then publish the draft to make it live.'

/**
 * beforeOperation: a rollback (Payload's restoreVersion) always lands as a
 * draft, so nothing live changes until the draft is published through the
 * normal publish checks. Restoring straight to live, from Payload's own
 * Restore button or the API, is refused. A draft changes nothing a visitor
 * sees, so the website refresh and the RAG sync are skipped, as for any
 * draft save.
 */
export const draftRollbackOnly: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'restoreVersion') return args
  const draft = (args as { draft?: unknown }).draft
  if (draft !== true && draft !== 'true') throw new APIError(LIVE_ROLLBACK_REFUSED, 400, undefined, true)
  req.context[ROLLBACK_FROM] = String((args as { id?: unknown }).id)
  req.context.disableRevalidate = true
  req.context.skipRag = true
  return args
}

/** The signed-in editor, when the save comes from one (not a script or an MCP key). */
export const editorOf = (req: PayloadRequest): string | null => {
  const user = req.user as { id?: unknown; collection?: string } | null | undefined
  return user?.id && user.collection === 'users' ? String(user.id) : null
}

/** beforeChange: who saved, and the version a rollback came from (cleared on any other save). */
export const stampEditor: CollectionBeforeChangeHook = ({ data, req }) => {
  data.updatedBy = editorOf(req)
  data.rolledBackFrom = (req.context[ROLLBACK_FROM] as string | undefined) ?? null
  return data
}

/**
 * Which event a save is, if any: a rollback, a publish, or an unpublish.
 * Draft saves and autosaves are not events: their versions are the record.
 * An unpublish is a save that ends in draft over a live entry and changes
 * the stored entry itself, which a draft save never does, so it is told
 * apart by reading the stored status.
 */
export const eventFor = async ({
  doc,
  previousDoc,
  req,
  storedStatus,
}: {
  doc: { _status?: string | null }
  previousDoc?: { _status?: string | null } | null
  req: PayloadRequest
  storedStatus: () => Promise<string | null | undefined>
}): Promise<EventAction | null> => {
  if (req.context[ROLLBACK_FROM]) return 'rolledBack'
  if (doc?._status === 'published') return 'published'
  if (doc?._status === 'draft' && previousDoc?._status === 'published') {
    return (await storedStatus()) === 'draft' ? 'unpublished' : null
  }
  return null
}

/**
 * afterChange: records publish, unpublish and rollback in contentEvents.
 * Saves made on the way by another entry's save (child pages re-saved after
 * their pillar, for example) are left out: only the entry the editor saved
 * is logged. Never fails the save.
 */
export const logContentEvent: CollectionAfterChangeHook = async ({ collection, doc, previousDoc, req }) => {
  try {
    // A rollback's route id is the version's, so the check is for other saves only.
    const routeId = (req.routeParams as { id?: unknown } | undefined)?.id
    if (!req.context[ROLLBACK_FROM] && routeId !== undefined && String(routeId) !== String(doc.id)) return doc
    const action = await eventFor({
      doc,
      previousDoc,
      req,
      storedStatus: async () => {
        const stored = await req.payload.db.findOne<{ id: string; _status?: string }>({
          collection: collection.slug,
          where: { id: { equals: doc.id } },
          req,
        })
        return stored?._status
      },
    })
    if (!action) return doc
    const latest = await req.payload.db.findVersions({
      collection: collection.slug,
      where: { parent: { equals: doc.id } },
      sort: '-updatedAt',
      limit: 1,
      pagination: false,
      req,
    })
    const version = latest.docs[0]?.id ? String(latest.docs[0].id) : null
    // Once per version and action: a page is saved again just after it is
    // created (the nested-docs plugin's breadcrumbs), and both saves end here.
    const last = await req.payload.db.find<{ id: string; action?: string; version?: string | null }>({
      collection: CONTENT_EVENTS,
      where: { and: [{ collectionSlug: { equals: collection.slug } }, { doc: { equals: String(doc.id) } }] },
      sort: '-createdAt',
      limit: 1,
      pagination: false,
      req,
    })
    if (last.docs[0]?.action === action && last.docs[0]?.version === version) return doc
    await req.payload.create({
      collection: CONTENT_EVENTS,
      data: {
        collectionSlug: collection.slug,
        doc: String(doc.id),
        action,
        user: editorOf(req),
        version,
        fromVersion: (req.context[ROLLBACK_FROM] as string | undefined) ?? null,
      },
      req,
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error(`[history] could not record the event for ${collection.slug} ${doc?.id}: ${(err as Error).message}`)
  }
  return doc
}
