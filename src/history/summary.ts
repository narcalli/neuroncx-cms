import type { Block, Field } from 'payload'

/**
 * What changed between two versions of an entry, in plain words for the
 * History tab: "Hero: Heading changed", "FAQ added", "Key points: 2 added".
 * Walks the collection's own fields, so it works for every collection.
 * Blocks and array rows are matched by their id, so moving one row is one
 * change, not a change to every row after it (Payload's own comparison
 * pairs rows by position).
 */

type Row = { id?: string | null; blockType?: string; [key: string]: unknown }
type Data = Record<string, unknown> | null | undefined

/** Fields that are not the editor's content, or are filled in on save (publishedAt, breadcrumbs). */
const SKIP = new Set([
  'id',
  '_status',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'updatedBy',
  'rolledBackFrom',
  'breadcrumbs',
  'reviewRequestedBy',
  'reviewRequestedAt',
])

const MAX_LINES = 8
const MAX_FIELDS_IN_LINE = 3

/** "heroImage" -> "Hero image". */
const words = (name: string): string => {
  const s = name.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim().toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const labelOf = (field: { name?: string; label?: unknown }): string => {
  const { label, name } = field
  if (typeof label === 'string' && label) return label
  if (label && typeof label === 'object') {
    const en = (label as Record<string, unknown>).en
    if (typeof en === 'string' && en) return en
  }
  return name ? words(name) : ''
}

const blockLabel = (block: Block | undefined, slug: string | undefined): string => {
  const singular = block?.labels?.singular
  if (typeof singular === 'string' && singular) return singular
  if (singular && typeof singular === 'object' && typeof (singular as Record<string, unknown>).en === 'string') {
    return (singular as Record<string, string>).en
  }
  return slug ? words(slug) : 'Block'
}

/** A row's own heading, so two blocks of one kind can be told apart. */
const rowTitle = (row: Row): string => {
  for (const key of ['heading', 'title', 'headline', 'name', 'label', 'blockName']) {
    const v = row[key]
    if (typeof v === 'string' && v.trim()) {
      const t = v.trim()
      return t.length > 40 ? `${t.slice(0, 39)}…` : t
    }
  }
  return ''
}

const named = (label: string, row: Row): string => {
  const t = rowTitle(row)
  return t ? `${label} ("${t}")` : label
}

/**
 * Empty values compare equal, and key order does not matter. Versions are
 * read unpopulated, so relationships are plain ids already.
 */
const normalise = (v: unknown): unknown => {
  if (v === undefined || v === null || v === '') return null
  if (Array.isArray(v)) return v.length ? v.map(normalise) : null
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) {
      const n = normalise(o[k])
      if (n !== null) out[k] = n
    }
    return Object.keys(out).length ? out : null
  }
  return v
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(normalise(a)) === JSON.stringify(normalise(b))

const isHidden = (field: Field): boolean => {
  const admin = (field as { admin?: { hidden?: boolean; disabled?: boolean; readOnly?: boolean } }).admin
  return Boolean(admin?.hidden || admin?.disabled || admin?.readOnly)
}

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v.filter((r) => r && typeof r === 'object') as Row[]) : [])

type Ctx = { blocks: Record<string, Block> }

/** The labels of the fields that changed, one level deep (for "Hero: Heading, Intro changed"). */
const changedFields = (fields: Field[], before: Data, after: Data, ctx: Ctx): string[] => {
  const out: string[] = []
  for (const field of fields) {
    if (field.type === 'ui' || field.type === 'join') continue
    if ('name' in field && field.name && SKIP.has(field.name)) continue
    if (isHidden(field)) continue
    if (field.type === 'row' || field.type === 'collapsible' || (field.type === 'group' && !('name' in field && field.name))) {
      out.push(...changedFields(field.fields, before, after, ctx))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          if (!same(before?.[tab.name], after?.[tab.name])) out.push(labelOf(tab))
        } else out.push(...changedFields(tab.fields, before, after, ctx))
      }
      continue
    }
    if (!('name' in field) || !field.name) continue
    if (!same(before?.[field.name], after?.[field.name])) out.push(labelOf(field))
  }
  return out
}

const fieldList = (labels: string[]): string =>
  labels.length > MAX_FIELDS_IN_LINE
    ? `${labels.slice(0, MAX_FIELDS_IN_LINE).join(', ')} and ${labels.length - MAX_FIELDS_IN_LINE} more`
    : labels.join(', ')

/** Rows matched by id: which were added, removed, edited, and whether the order changed. */
const compareRows = (before: Row[], after: Row[]) => {
  const beforeIds = new Map(before.map((r, i) => [r.id ?? `#${i}`, r]))
  const afterIds = new Map(after.map((r, i) => [r.id ?? `#${i}`, r]))
  const added = after.filter((r, i) => !beforeIds.has(r.id ?? `#${i}`))
  const removed = before.filter((r, i) => !afterIds.has(r.id ?? `#${i}`))
  const kept = after
    .map((r, i) => [r, beforeIds.get(r.id ?? `#${i}`)] as const)
    .filter((pair): pair is readonly [Row, Row] => Boolean(pair[1]))
  const orderBefore = before.map((r, i) => r.id ?? `#${i}`).filter((id) => afterIds.has(id))
  const orderAfter = after.map((r, i) => r.id ?? `#${i}`).filter((id) => beforeIds.has(id))
  const moved = orderBefore.join('|') !== orderAfter.join('|')
  return { added, removed, kept, moved }
}

const blockOf = (field: Field, slug: string | undefined, ctx: Ctx): Block | undefined => {
  if (!slug || field.type !== 'blocks') return undefined
  const local = [...(field.blocks || []), ...(field.blockReferences || [])].find(
    (b) => typeof b !== 'string' && b.slug === slug,
  ) as Block | undefined
  return local ?? ctx.blocks[slug]
}

const blocksLines = (field: Field & { type: 'blocks' }, before: unknown, after: unknown, ctx: Ctx): string[] => {
  const { added, removed, kept, moved } = compareRows(asRows(before), asRows(after))
  const lines: string[] = []
  const label = (row: Row) => named(blockLabel(blockOf(field, row.blockType, ctx), row.blockType), row)
  for (const row of added) lines.push(`${label(row)} added`)
  for (const row of removed) lines.push(`${label(row)} removed`)
  for (const [now, was] of kept) {
    const block = blockOf(field, now.blockType, ctx)
    if (!block) {
      if (!same(was, now)) lines.push(`${label(now)} changed`)
      continue
    }
    const fields = changedFields(block.fields, was, now, ctx)
    if (fields.length) lines.push(`${label(now)}: ${fieldList(fields)} changed`)
  }
  if (moved) lines.push(`${labelOf(field)}: order changed`)
  return lines
}

const arrayLine = (field: Field & { type: 'array' }, before: unknown, after: unknown, ctx: Ctx): string[] => {
  const { added, removed, kept, moved } = compareRows(asRows(before), asRows(after))
  const edited = kept.filter(([now, was]) => changedFields(field.fields, was, now, ctx).length > 0).length
  const parts = [
    added.length ? `${added.length} added` : '',
    removed.length ? `${removed.length} removed` : '',
    edited ? `${edited} edited` : '',
    moved ? 'order changed' : '',
  ].filter(Boolean)
  return parts.length ? [`${labelOf(field)}: ${parts.join(', ')}`] : []
}

const walk = (fields: Field[], before: Data, after: Data, ctx: Ctx, prefix: string): string[] => {
  const lines: string[] = []
  for (const field of fields) {
    if (field.type === 'ui' || field.type === 'join') continue
    if ('name' in field && field.name && SKIP.has(field.name)) continue
    if (isHidden(field)) continue
    if (field.type === 'row' || field.type === 'collapsible' || (field.type === 'group' && !('name' in field && field.name))) {
      lines.push(...walk(field.fields, before, after, ctx, prefix))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          lines.push(
            ...walk(tab.fields, before?.[tab.name] as Data, after?.[tab.name] as Data, ctx, `${prefix}${labelOf(tab)}: `),
          )
        } else lines.push(...walk(tab.fields, before, after, ctx, prefix))
      }
      continue
    }
    if (!('name' in field) || !field.name) continue
    const was = before?.[field.name]
    const now = after?.[field.name]
    if (same(was, now)) continue
    if (field.type === 'blocks') lines.push(...blocksLines(field, was, now, ctx).map((l) => prefix + l))
    else if (field.type === 'array') lines.push(...arrayLine(field, was, now, ctx).map((l) => prefix + l))
    else if (field.type === 'group') {
      const inner = changedFields(field.fields, was as Data, now as Data, ctx)
      lines.push(`${prefix}${labelOf(field)}${inner.length ? `: ${fieldList(inner)}` : ''} changed`)
    } else lines.push(`${prefix}${labelOf(field)} changed`)
  }
  return lines
}

/**
 * The change from one version to the next, as short lines. With no earlier
 * version, the entry was created. Long lists end with "and N more changes".
 */
export const summariseChange = (
  fields: Field[],
  before: Data,
  after: Data,
  blocks: Record<string, Block> = {},
): string[] => {
  if (!before) return ['Created']
  const lines = walk(fields, before, after, { blocks }, '')
  if (!lines.length) return ['No content changes']
  return lines.length > MAX_LINES
    ? [...lines.slice(0, MAX_LINES - 1), `and ${lines.length - MAX_LINES + 1} more changes`]
    : lines
}
