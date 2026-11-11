import type { CollectionAfterReadHook, FieldHook, PayloadRequest } from 'payload'

/**
 * Rows marked Pending (a `pending` checkbox, such as an episode point or a
 * stat not yet confirmed) are kept for editors and shown with a Pending tag in
 * draft preview, but never reach visitors, WhatsApp or the knowledge base.
 */

const isPending = (row: unknown) => Boolean(row && typeof row === 'object' && (row as { pending?: unknown }).pending === true)

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype

// Pending rows dropped from every array, however deep: a stat inside a layout
// block (layout[].stats[]) as much as an episode point at the top level.
const strip = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.filter((row) => !isPending(row)).map(strip)
  if (!isPlainObject(value)) return value
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value)) out[key] = strip(v)
  return out
}

/** The document without its pending rows, in every array at any depth. */
export const withoutPendingRows = <T>(doc: T): T => strip(doc) as T

// Who gets pending rows: signed-in readers (the website's draft preview) and
// server code on the Local API, so a read and save never loses one.
const seesPending = (req: PayloadRequest) => Boolean(req.user) || req.payloadAPI === 'local'

/**
 * afterRead: visitors reading through the API (the website outside draft
 * mode) get no pending rows. Signed-in readers, which includes the website's
 * draft preview, get every row. Server code using the Local API reads them
 * all too, so a read and save never loses one.
 */
export const hidePendingRowsFromVisitors: CollectionAfterReadHook = ({ doc, req }) =>
  seesPending(req) ? doc : withoutPendingRows(doc)

/**
 * The same, on one array field, for rows inside blocks: a block can sit in
 * any collection's layout, and not every collection has the hook above.
 */
export const hidePendingFieldRowsFromVisitors: FieldHook = ({ value, req }) =>
  seesPending(req) || !Array.isArray(value) ? value : withoutPendingRows(value)
