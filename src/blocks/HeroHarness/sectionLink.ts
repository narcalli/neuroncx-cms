import type { TextFieldSingleValidation } from 'payload'

/**
 * A hero button can jump to a section further down the same page: a block in
 * the same layout whose Anchor ID (htmlId, in its Appearance panel) is set.
 * The website draws that block with the ID as its HTML id, so the button's
 * address is "#" and the ID.
 *
 * Shared by the config (the check on publish) and the admin dropdown
 * (SectionPicker.tsx), so this file has no server-only imports.
 */

export type PageSection = { id: string; name: string; hidden: boolean; index: number }

type BlockLike = { htmlId?: unknown; hidden?: unknown; blockType?: unknown; blockName?: unknown } & Record<string, unknown>

/** A block's name for the list: its own name, else its heading or title, else its type in words. */
export const blockNameOf = (block: BlockLike): string => {
  for (const key of ['blockName', 'heading', 'title', 'headline', 'label']) {
    const v = block[key]
    if (typeof v === 'string' && v.trim()) return v.trim().split(/\r?\n/)[0]
  }
  const type = typeof block.blockType === 'string' ? block.blockType : 'Block'
  const words = type.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** The blocks with an Anchor ID, in page order, leaving out the hero itself. */
export const sectionsOf = (blocks: unknown, ownIndex?: number): PageSection[] =>
  (Array.isArray(blocks) ? (blocks as BlockLike[]) : []).flatMap((block, index) =>
    block && typeof block.htmlId === 'string' && block.htmlId && index !== ownIndex
      ? [{ id: block.htmlId, name: blockNameOf(block), hidden: block.hidden === true, index }]
      : [],
  )

/**
 * Where the button sits: the path of the blocks list and the hero's place in
 * it, from the field's path ("layout.0.buttons.1.section", or the same as
 * segments). Null when the path is not a button inside a block.
 */
export const blocksPathOf = (path: string | (string | number)[] | undefined): { blocks: string[]; own: number } | null => {
  const parts = (Array.isArray(path) ? path : (path ?? '').split('.')).map(String)
  const at = parts.lastIndexOf('buttons')
  if (at < 2 || !/^\d+$/.test(parts[at - 1])) return null
  return { blocks: parts.slice(0, at - 1), own: Number(parts[at - 1]) }
}

const getIn = (data: unknown, path: string[]): unknown =>
  path.reduce<unknown>((at, key) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[key] : undefined), data)

/**
 * On publish: a shown button set to "Section on this page" needs a section,
 * and that section has to be on the page and not hidden. Drafts are not
 * checked, so an editor can set the Anchor ID after choosing it.
 */
export const validateSection: TextFieldSingleValidation = (value, { data, siblingData, path }) => {
  const sibling = siblingData as { type?: string; label?: string | null } | undefined
  if (sibling?.type !== 'section' || !sibling.label?.trim()) return true
  if (!value) return 'Choose the section the button jumps to, or change the link type.'
  const where = blocksPathOf(path)
  const blocks = where ? getIn(data, where.blocks) : (data as { layout?: unknown })?.layout
  const target = sectionsOf(blocks, where?.own).find((s) => s.id === value)
  if (!target) {
    return `No block on this page has the Anchor ID "${value}" any more. Choose another section, or set that Anchor ID on a block.`
  }
  if (target.hidden) return `"${target.name}" (#${value}) is hidden, so the button would go nowhere. Show the block, or choose another section.`
  return true
}
