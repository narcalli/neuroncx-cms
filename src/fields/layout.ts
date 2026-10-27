import type { BlocksField, BlockSlug, CheckboxField, Field, UIField, Validate } from 'payload'
import { blocks as validateBlocks } from 'payload/shared'

import type { PayloadRequest } from 'payload'

import {
  defaultRowKey,
  getSection,
  sectionBlockSlug,
  sectionForBlockType,
  type DefaultLayoutRow,
} from '../content/sections/defineSection'
import { HUB_PAGE_BLOCKS, NEVER_IN_LAYOUT, SITE_BLOCKS } from '../content/sections/siteBlocks'
import { getContentCollection } from '../content/registry'

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
 * Highlight (navy) marks the one section a page most wants read, so a page
 * has one navy section at most, and only sections that allow it may use it:
 * the closing panel, and on industry pages the episode. `allowed` names the
 * sections this layout's collection allows (the closing panel when unknown).
 * A page that shows the closing panel already has its navy panel, so no
 * section above it may be navy as well. Returns the problem, or null.
 */
export const navyProblem = (
  layout: unknown,
  { allowed = ['closing panel'], showsClosing = false }: { allowed?: string[]; showsClosing?: boolean } = {},
): string | null => {
  if (!Array.isArray(layout)) return null
  const navy = (layout as LayoutBlock[])
    .map((block, index) => ({ block, index, def: sectionForBlockType(block?.blockType) }))
    .filter(({ block }) => block?.background === 'navy')
  const name = ({ block, index }: { block: LayoutBlock; index: number }) => `#${index + 1} ${labelOf(block)}`

  const offenders = navy.filter(({ def }) => !def?.navyAllowed)
  if (offenders.length) {
    const who = allowed.map((a) => `the ${a}`).join(' or ')
    return `Only ${who} can use Highlight (navy). Set ${offenders.map(name).join(', ')} back to another background.`
  }
  if (navy.length > 1) {
    return `Highlight (navy) marks the one section the page most wants read, so a page has one. ${navy.map(name).join(' and ')} both use it: keep it on one and set the other back to another background.`
  }
  const above = navy.find(({ def }) => def?.key !== 'closing')
  if (showsClosing && above) {
    return `This page shows the closing panel, which is navy, and a page has one navy section. Set ${name(above)} back to another background, or turn off Show the closing panel on the Page tab.`
  }
  return null
}

/**
 * A placement marker (such as Grouping sections) says where one thing goes,
 * so a layout may hold it once. Returns the problem, or null.
 */
export const placementProblem = (layout: unknown): string | null => {
  if (!Array.isArray(layout)) return null
  const seen = new Map<string, number>()
  for (const block of layout as LayoutBlock[]) {
    const def = sectionForBlockType(block?.blockType)
    if (def?.placement) seen.set(def.label, (seen.get(def.label) ?? 0) + 1)
  }
  const twice = [...seen].filter(([, n]) => n > 1).map(([label]) => label)
  return twice.length ? `${twice.join(' and ')} can be in the layout once. Remove the extra one.` : null
}

export { layoutWarnings } from './LayoutField/warnings'

const layoutRule: Validate = async (value, options) => {
  const builtIn = await validateBlocks(value as any, options as any)
  if (builtIn !== true) return builtIn
  // The sections this collection lets use navy, by label, for the message.
  const entry = getContentCollection(String((options as { collectionSlug?: string }).collectionSlug ?? ''))
  const allowed = (entry?.sections ?? [])
    .map((key) => getSection(key))
    .filter((d) => d?.navyAllowed)
    .map((d) => (d!.key === 'closing' ? 'closing panel' : d!.label.toLowerCase()))
  const data = (options as { data?: { showClosing?: unknown } }).data
  return navyProblem(value, { allowed: allowed.length ? allowed : undefined, showsClosing: data?.showClosing === true }) ?? placementProblem(value) ?? true
}

/** Layout rows for a list of section keys, as a new entry starts with them. */
export const layoutBlocksFor = (keys: string[]): { blockType: string }[] =>
  keys.map((key) => ({ blockType: sectionBlockSlug(key) }))

/**
 * Layout rows for a default layout. A Shared content row places the shared
 * content record with its key, draft or published (the website draws only a
 * published one); while no record has that key the row is left out, so a
 * page never holds a Shared content section with nothing chosen.
 */
export const resolveDefaultLayout = async (
  rows: DefaultLayoutRow[],
  req: Partial<PayloadRequest> | undefined,
): Promise<Record<string, unknown>[]> => {
  const wanted = [...new Set(rows.flatMap((r) => (typeof r === 'string' ? [] : [r.sharedContent])))]
  const ids = new Map<string, string>()
  if (wanted.length && req?.payload) {
    const { docs } = await req.payload.find({
      collection: 'sharedContent',
      where: { key: { in: wanted } },
      draft: true,
      depth: 0,
      limit: wanted.length,
      pagination: false,
      overrideAccess: true,
      req: req as PayloadRequest,
    })
    for (const d of docs as { id: string | number; key?: string }[]) if (d.key) ids.set(d.key, String(d.id))
  }
  return rows.flatMap((row) => {
    if (typeof row === 'string') return [{ blockType: sectionBlockSlug(row) }]
    const item = ids.get(row.sharedContent)
    return item ? [{ blockType: sectionBlockSlug(row.key), item }] : []
  })
}

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
  /** The rows a new entry starts with, in order. */
  defaultLayout: DefaultLayoutRow[]
}): { sidebar: CheckboxField; fields: Field[] } => {
  for (const key of sections) {
    if (!getSection(key)) throw new Error(`${collection}: no section is registered as ${key}.`)
  }
  for (const key of defaultLayout.map(defaultRowKey)) {
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
    // Looked up when an entry is created, for the shared content records it places.
    defaultValue: ({ req }) => resolveDefaultLayout(defaultLayout, req),
    admin: {
      ...base.admin,
      components: { Field: '@/fields/LayoutField/LayoutBlocksField#LayoutBlocksField' },
    },
  }

  return { sidebar, fields: [notes, layout] }
}
