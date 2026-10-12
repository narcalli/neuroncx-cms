import type { Field, FieldHook } from 'payload'

/**
 * The "Show" switch shared by every block that lists integrations
 * (Integrations, Integrations Marquee, Partner Strip). It reads entries from
 * the Integrations collection (all live ones, a filtered set, or a
 * hand-picked list) or falls back to the list typed into the block.
 *
 * Blocks saved before populateBy existed have no value for it, so every check
 * treats a missing value as "manual". Those pages keep working with no edits.
 */
export type SourceMode = 'all' | 'filter' | 'selection' | 'manual'

export const sourceMode = (siblingData: { populateBy?: SourceMode } | undefined): SourceMode =>
  siblingData?.populateBy ?? 'manual'

/** For the block's own typed list: shown only in manual mode. */
export const showWhenManual = (_: unknown, siblingData: { populateBy?: SourceMode } | undefined) =>
  sourceMode(siblingData) === 'manual'

const idOf = (v: unknown): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : null

// Visitors never get a hand-picked entry that is unpublished or not Live: it
// is dropped from the list, not shown. Logged-in editors see the list as
// saved, so they can spot and fix an entry that has gone out of date.
//
// Only requests over the REST or GraphQL API are filtered. Server-side code
// using the Local API (scripts, jobs) gets the list as saved: a script that
// reads a page and writes it back would otherwise drop the hidden entries
// for good.
const onlyLiveForVisitors: FieldHook = async ({ value, req }) => {
  if (req.user || req.payloadAPI === 'local' || !Array.isArray(value) || value.length === 0) return value
  const ids = value.map(idOf).filter((id): id is string => Boolean(id))
  const live = await req.payload.find({
    collection: 'integrations',
    where: {
      and: [{ id: { in: ids } }, { _status: { equals: 'published' } }, { status: { equals: 'live' } }],
    },
    depth: 0,
    limit: ids.length,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const keep = new Set(live.docs.map((d) => String(d.id)))
  return value.filter((v) => {
    const id = idOf(v)
    return id !== null && keep.has(id)
  })
}

/**
 * The switch and its settings, to sit just before the block's typed list.
 * limit sets the "How many" range for All and Filter.
 */
export const integrationSourceFields = (limit: { min: number; max: number }): Field[] => [
  {
    name: 'populateBy',
    type: 'select',
    label: 'Show',
    defaultValue: 'manual',
    options: [
      { label: 'All live integrations', value: 'all' },
      { label: 'Filter by category or product', value: 'filter' },
      { label: 'Hand-picked', value: 'selection' },
      { label: 'Manual list, old style', value: 'manual' },
    ],
  },
  // Links to the editable lists, so a category or product added in the
  // admin is available here straight away.
  {
    name: 'categories',
    type: 'relationship',
    relationTo: 'integrationCategories',
    hasMany: true,
    label: 'Categories',
    admin: { sortOptions: 'order', condition: (_, siblingData) => sourceMode(siblingData) === 'filter' },
  },
  {
    name: 'products',
    type: 'relationship',
    relationTo: 'products',
    hasMany: true,
    label: 'Products',
    admin: { sortOptions: 'order', condition: (_, siblingData) => sourceMode(siblingData) === 'filter' },
  },
  {
    name: 'featuredOnly',
    type: 'checkbox',
    label: 'Featured only',
    defaultValue: false,
    admin: { condition: (_, siblingData) => ['all', 'filter'].includes(sourceMode(siblingData)) },
  },
  {
    name: 'selectedDocs',
    type: 'relationship',
    relationTo: 'integrations',
    hasMany: true,
    label: 'Integrations',
    hooks: { afterRead: [onlyLiveForVisitors] },
    admin: { condition: (_, siblingData) => sourceMode(siblingData) === 'selection' },
  },
  {
    name: 'limit',
    type: 'number',
    label: 'How many',
    defaultValue: limit.max,
    min: limit.min,
    max: limit.max,
    admin: { condition: (_, siblingData) => ['all', 'filter'].includes(sourceMode(siblingData)) },
  },
]
