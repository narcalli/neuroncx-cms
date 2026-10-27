import type { Condition } from 'payload'

/**
 * Field tabs that only matter while a section reading them is on the page
 * (an industry's Record tab, read by the industry record section). Kept
 * free of other imports so the knowledge base serializer can use it.
 */

const LAYOUT_CONDITIONS = new WeakSet<object>()

/**
 * A tab condition: true while any of the sections is in the entry's layout,
 * hidden rows included. Hiding the tab keeps its data, and the knowledge
 * base still reads it (isLayoutCondition, src/rag/serialize.ts).
 */
export const whileLayoutHas = (keys: string[]): Condition => {
  const blockTypes = keys.map((key) => `${key}Section`)
  const condition: Condition = (data) =>
    Array.isArray(data?.layout) &&
    (data.layout as { blockType?: unknown }[]).some((b) => blockTypes.includes(String(b?.blockType)))
  LAYOUT_CONDITIONS.add(condition)
  return condition
}

/** Whether a condition is a whileLayoutHas one. */
export const isLayoutCondition = (condition: unknown): boolean =>
  typeof condition === 'function' && LAYOUT_CONDITIONS.has(condition)
