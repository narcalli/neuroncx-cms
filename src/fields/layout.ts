import type { BlocksField, BlockSlug, CheckboxField, Field, UIField, Validate } from 'payload'
import { blocks as validateBlocks } from 'payload/shared'

import {
  getSection,
  sectionBlockSlug,
  sectionForBlockType,
} from '../content/sections/defineSection'
import { HUB_PAGE_BLOCKS, NEVER_IN_LAYOUT, SITE_BLOCKS } from '../content/sections/siteBlocks'

/**
 * The layout of an entry page (foundation.md section 5): the sections and
 * page blocks between the fixed hero and the closing, in the order an editor
 * drags them. Entry pages only, so it sits on the Page tab and its switch
 * shows only with Own page on.
 *
 * usePageDefaults on: the entry follows its collection's default layout and
 * the field shows it, read-only. A save writes the default into the field;
 * the website and the publish check read the default directly, so a change
 * to the default reaches every entry still following it.
 */

type LayoutBlock = {
  blockType?: string
  blockName?: string | null
  background?: string | null
  hidden?: boolean | null
}

const labelOf = (block: LayoutBlock): string =>
  sectionForBlockType(block.blockType)?.label ??
  String(
    [...SITE_BLOCKS, ...HUB_PAGE_BLOCKS].find((b) => b.slug === block.blockType)?.labels?.singular ??
      block.blockType ??
      'block',
  )

/**
 * Only the closing section may use Highlight (navy): the page's one navy
 * band. Returns the problem, or null.
 */
export const navyProblem = (layout: unknown): string | null => {
  if (!Array.isArray(layout)) return null
  const offenders = (layout as LayoutBlock[])
    .map((block, index) => ({ block, index }))
    .filter(
      ({ block }) =>
        block?.background === 'navy' && !sectionForBlockType(block.blockType)?.navyAllowed,
    )
  if (!offenders.length) return null
  const named = offenders.map(({ block, index }) => `#${index + 1} ${labelOf(block)}`).join(', ')
  return `Only the closing panel can use Highlight (navy). Set ${named} back to another background.`
}

export { layoutWarnings } from './LayoutField/warnings'

const layoutRule: Validate = async (value, options) => {
  const builtIn = await validateBlocks(value as any, options as any)
  if (builtIn !== true) return builtIn
  return navyProblem(value) ?? true
}

/** Layout rows for a list of section keys, as a new entry starts with them. */
export const layoutBlocksFor = (keys: string[]): { blockType: string }[] =>
  keys.map((key) => ({ blockType: sectionBlockSlug(key) }))

/** The section keys of a stored layout, in order, without hidden rows or page blocks. */
export const sectionKeysIn = (layout: unknown): string[] =>
  Array.isArray(layout)
    ? (layout as LayoutBlock[])
        .filter((block) => !block?.hidden)
        .map((block) => sectionForBlockType(block?.blockType)?.key)
        .filter((key): key is string => Boolean(key))
    : []

/**
 * A blocks field of sections and page blocks, by reference: collapsed rows,
 * the navy rule, and never a hero or the plain faq block. Used for an
 * entry's layout and for a hub's own layout and default entry layout.
 */
export const sectionBlocksField = ({
  name,
  label,
  references,
  description,
  owner,
}: {
  name: string
  label: string
  references: string[]
  description: string
  /** Named in config errors. */
  owner: string
}): BlocksField => {
  const banned = references.filter((slug) => (NEVER_IN_LAYOUT as readonly string[]).includes(slug))
  if (banned.length) throw new Error(`${owner}: ${banned.join(', ')} can never be in a layout.`)
  return {
    name,
    type: 'blocks',
    label,
    blocks: [],
    // Registered sections and SITE_BLOCKS, all in the config's top-level blocks.
    blockReferences: references as BlockSlug[],
    validate: layoutRule,
    admin: { initCollapsed: true, description },
  }
}

export const layoutField = ({
  collection,
  sections,
  defaultLayout,
}: {
  collection: string
  /** Section keys editors may add, from the section registry. */
  sections: string[]
  /** Section keys a new entry starts with, in order. */
  defaultLayout: string[]
}): { sidebar: CheckboxField; fields: Field[] } => {
  for (const key of sections) {
    if (!getSection(key)) throw new Error(`${collection}: no section is registered as ${key}.`)
  }
  for (const key of defaultLayout) {
    if (!sections.includes(key)) {
      throw new Error(`${collection}: the default layout uses ${key}, which is not an allowed section.`)
    }
  }

  const sidebar: CheckboxField = {
    name: 'usePageDefaults',
    type: 'checkbox',
    label: 'Use page defaults',
    defaultValue: true,
    admin: {
      position: 'sidebar',
      condition: (data) => Boolean(data?.hasOwnPage),
      description:
        'On: the page follows the default layout, and changes to the default reach it. Off: the layout on the Page tab is this page\'s own.',
    },
  }

  const notes: UIField = {
    name: 'layoutNotes',
    type: 'ui',
    admin: { components: { Field: '@/fields/LayoutField/LayoutNotes#LayoutNotes' } },
  }

  const base = sectionBlocksField({
    name: 'layout',
    label: 'Page sections',
    references: [...sections.map(sectionBlockSlug), ...SITE_BLOCKS.map((b) => b.slug)],
    description:
      'The sections between the page hero and the end of the page, in order. Drag to reorder. Read-only while Use page defaults is on.',
    owner: collection,
  })
  const layout: BlocksField = {
    ...base,
    defaultValue: layoutBlocksFor(defaultLayout),
    admin: {
      ...base.admin,
      components: { Field: '@/fields/LayoutField/LayoutBlocksField#LayoutBlocksField' },
    },
  }

  return { sidebar, fields: [notes, layout] }
}
