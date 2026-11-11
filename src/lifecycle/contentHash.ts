import { createHash } from 'crypto'

/**
 * Keys that do not change what an entry says: ids, timestamps, draft state,
 * who saved it, block names, the gate override, which is granted for a
 * hash and so must not change it, and a review request.
 */
const NOT_CONTENT = new Set([
  'id',
  '_id',
  'createdAt',
  'updatedAt',
  '_status',
  'updatedBy',
  'rolledBackFrom',
  'blockName',
  'gateOverride',
  'gateOverrideReason',
  'gateOverrideHash',
  // A review request (src/review/fields.ts) is about the content, not part of it.
  'readyForReview',
  'reviewNote',
  'reviewRequestedBy',
  'reviewRequestedAt',
])

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype

const idOf = (v: unknown): string => (isPlainObject(v) && 'id' in v ? String(v.id) : String(v))

// The same content in a saved version and in a save about to happen can
// differ in shape: a relationship populated or not, an empty field missing or
// null, false or absent. This reduces both to one form.
const fieldsOf = (value: Record<string, unknown>): Record<string, unknown> | undefined => {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort()) {
    if (NOT_CONTENT.has(key)) continue
    const v = normalize(value[key])
    if (v !== undefined) out[key] = v
  }
  return Object.keys(out).length ? out : undefined
}

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const rows = value.map(normalize).filter((v) => v !== undefined)
    return rows.length ? rows : undefined
  }
  if (value === null || value === undefined || value === '' || value === false) return undefined
  if (!isPlainObject(value)) return value
  // A populated document inside the entry: only which one it is.
  if ('id' in value && ('createdAt' in value || 'updatedAt' in value)) return String(value.id)
  // A link to one of several collections.
  if (typeof value.relationTo === 'string' && 'value' in value && Object.keys(value).length === 2) {
    return value.value == null ? undefined : { relationTo: value.relationTo, value: idOf(value.value) }
  }
  return fieldsOf(value)
}

/**
 * A fingerprint of an entry's content: equal for two versions that say the
 * same thing, different as soon as any field a visitor or the bot could read
 * changes. Taken from the raw fields, not the flattened knowledge base text,
 * so a change to the flattener does not orphan existing benchmark runs.
 */
export const contentHash = (doc: unknown): string =>
  createHash('sha256')
    // The entry itself has an id and timestamps too, but is never collapsed to its id.
    .update(JSON.stringify((isPlainObject(doc) ? fieldsOf(doc) : normalize(doc)) ?? null))
    .digest('hex')
    .slice(0, 32)
