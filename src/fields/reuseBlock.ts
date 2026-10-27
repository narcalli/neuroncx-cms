import type { Block, Field } from 'payload'

/**
 * Reusing a page block's fields on a collection entry, so the website can
 * draw the entry's data with that block's component.
 */

/**
 * A deep copy of a field config, functions (validators, conditions, filters)
 * kept as they are. Payload adjusts field objects in place when it loads a
 * config, so the block and each entry collection get their own.
 */
export const copyField = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(copyField) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copyField(v)])) as T
  }
  return value
}

/** A block's field by name, copied. */
export const blockField = (block: Block, name: string): Field => {
  const found = block.fields.find((f) => 'name' in f && f.name === name)
  if (!found) throw new Error(`${block.slug} has no ${name} field to reuse.`)
  return copyField(found)
}

// Payload adds these to a block when the config loads; a group has no use for them.
const BLOCK_ONLY = new Set(['blockName', 'blockType', 'id'])

/**
 * Every field of a block, copied, for a group on an entry: without Payload's
 * own block fields and any names in `omit`, and with nothing required at the
 * top, so the entry can be published with the group left empty. Limits stay,
 * and rows inside lists keep their own required fields.
 */
export const blockGroupFields = (block: Block, omit: string[] = []): Field[] => {
  const leave = new Set([...BLOCK_ONLY, ...omit])
  const relax = (fields: Field[]): Field[] =>
    fields
      .filter((f) => !('name' in f && leave.has(f.name)))
      .map((f): Field => {
        if (f.type === 'row' || f.type === 'collapsible') return { ...f, fields: relax(f.fields) }
        if (f.type === 'tabs') return { ...f, tabs: f.tabs.map((t) => ({ ...t, fields: relax(t.fields) })) }
        return 'required' in f && f.required ? ({ ...f, required: false } as Field) : f
      })
  return relax(copyField(block.fields))
}
