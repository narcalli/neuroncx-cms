import type { CollectionAfterReadHook } from 'payload'

/**
 * Rows marked Pending (a `pending` checkbox, such as an episode point or a
 * stat not yet confirmed) are kept for editors and shown with a Pending tag in
 * draft preview, but never reach visitors, WhatsApp or the knowledge base.
 */

const isPending = (row: unknown) => Boolean(row && typeof row === 'object' && (row as { pending?: unknown }).pending === true)

/** The document without its pending rows, in every top-level array. */
export const withoutPendingRows = <T>(doc: T): T => {
  if (!doc || typeof doc !== 'object') return doc
  const out: Record<string, unknown> = { ...(doc as Record<string, unknown>) }
  for (const [key, value] of Object.entries(out)) {
    if (Array.isArray(value) && value.some(isPending)) out[key] = value.filter((row) => !isPending(row))
  }
  return out as T
}

/**
 * afterRead: visitors reading through the API (the website outside draft
 * mode) get no pending rows. Signed-in readers, which includes the website's
 * draft preview, get every row. Server code using the Local API reads them
 * all too, so a read and save never loses one.
 */
export const hidePendingRowsFromVisitors: CollectionAfterReadHook = ({ doc, req }) =>
  req.user || req.payloadAPI === 'local' ? doc : withoutPendingRows(doc)
