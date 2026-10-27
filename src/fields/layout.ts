import type { BlocksField, BlockSlug, CheckboxField, Field, UIField, Validate } from 'payload'
import { blocks as validateBlocks } from 'payload/shared'

import type { PayloadRequest } from 'payload'

import {
  defaultRowBlock,
  defaultRowKey,
  getSection,
  sectionBlockSlug,
  sectionForBlockType,
  type DefaultLayoutRow,
} from '../content/sections/defineSection'
import {
  ENTRY_EXTRA_BLOCKS,
  HERO_BLOCKS,
  HUB_PAGE_BLOCKS,
  LAYOUT_HERO_BLOCKS,
  NEVER_IN_LAYOUT,
  SITE_BLOCKS,
} from '../content/sections/siteBlocks'
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
    [...SITE_BLOCKS, ...HUB_PAGE_BLOCKS, ...ENTRY_EXTRA_BLOCKS].find((b) => b.slug === block.blockType)?.labels?.singular ??
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
 *
 * `freeBlocks` (a layout with every page block, siteBlocks 'all'): page
 * blocks may use navy as on a Page, the closing CTA block counts as navy (it
 * is a navy panel by design), and the one-navy rule covers sections and
 * blocks together.
 */
export const navyProblem = (
  layout: unknown,
  {
    allowed = ['closing panel'],
    showsClosing = false,
    freeBlocks = false,
  }: { allowed?: string[]; showsClosing?: boolean; freeBlocks?: boolean } = {},
): string | null => {
  if (!Array.isArray(layout)) return null
  const byDesign = (block: LayoutBlock) => freeBlocks && block?.blockType === 'closingCta'
  const navy = (layout as LayoutBlock[])
    .map((block, index) => ({ block, index, def: sectionForBlockType(block?.blockType) }))
    .filter(({ block }) => block?.background === 'navy' || byDesign(block))
  const name = ({ block, index }: { block: LayoutBlock; index: number }) =>
    `#${index + 1} ${labelOf(block)}${byDesign(block) ? ' (navy by design)' : ''}`

  // Sections may use navy only where allowed; page blocks only in a free layout.
  const offenders = navy.filter(({ def }) => (def ? !def.navyAllowed : !freeBlocks))
  if (offenders.length) {
    const who = allowed.map((a) => `the ${a}`).join(' or ')
    if (freeBlocks) {
      return `Of the sections, only ${who} can use Highlight (navy); any page block can. Set ${offenders.map(name).join(', ')} back to another background.`
    }
    return `Only ${who} can use Highlight (navy). Set ${offenders.map(name).join(', ')} back to another background.`
  }
  if (freeBlocks && navy.length > 1) {
    return `Highlight (navy) marks the one part of the page most wanted read, so a page has one, across sections and blocks. ${navy.map(name).join(' and ')} use it: keep one and set the others back to another background, or remove the extra closing call to action.`
  }
  if (navy.length > 1) {
    return `Highlight (navy) marks the one section the page most wants read, so a page has one. ${navy.map(name).join(' and ')} both use it: keep it on one and set the other back to another background.`
  }
  const above = navy.find(({ def }) => def?.key !== 'closing')
  if (showsClosing && above && byDesign(above.block)) {
    return `This page shows the closing panel, and ${name(above)} is a second one. Remove it, or turn off Show the closing panel on the Page tab.`
  }
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

type Row = { block: LayoutBlock; index: number }

const rowsShown = (layout: unknown): Row[] =>
  Array.isArray(layout)
    ? (layout as LayoutBlock[]).map((block, index) => ({ block, index })).filter(({ block }) => block && !block.hidden)
    : []

const rowName = ({ block, index }: Row) => `#${index + 1} ${labelOf(block)}`

const listed = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names.join(''))

const heroLabels = () => LAYOUT_HERO_BLOCKS.map((slug) => labelOf({ blockType: slug }))

/**
 * A page has one hero, its one H1 (siteBlocks 'all'). With Hero design set
 * to Hero block from the layout, the first row shown is a hero block and no
 * other row is; with any other design the entry's own hero fields draw the
 * hero, so no row is a hero block. Hidden rows are not drawn, so they do not
 * count. Returns the problem, or null.
 */
export const heroProblem = (
  layout: unknown,
  { blockHero = false, usesDefaults = false }: { blockHero?: boolean; usesDefaults?: boolean } = {},
): string | null => {
  const rows = rowsShown(layout)
  const heroes = rows.filter(({ block }) => (HERO_BLOCKS as readonly string[]).includes(String(block.blockType)))
  if (!blockHero) {
    if (!heroes.length) return null
    const many = heroes.length > 1
    return `${listed(heroes.map(rowName))} ${many ? 'are hero blocks' : 'is a hero block'}, but Hero design draws this page's hero from the hero fields, and a page has one hero, its one H1. Remove ${many ? 'them' : 'it'}, or set Hero design to Hero block from the layout.`
  }
  const first = rows[0]
  if (!first || !(LAYOUT_HERO_BLOCKS as readonly string[]).includes(String(first.block.blockType))) {
    const fix = usesDefaults ? 'Turn off Use page defaults, then add one at the top' : 'Add one at the top'
    return `Hero design is Hero block from the layout, so the first row must be a hero block: ${listed(heroLabels())}. ${fix}, or pick another hero design.`
  }
  const extra = heroes.filter((r) => r !== first)
  return extra.length ? `A page has one hero, its one H1, and the first row holds it. Remove ${listed(extra.map(rowName))}.` : null
}

/**
 * The plain FAQ block and the FAQ section both send FAQPage data, and the
 * closing CTA block and the closing panel section both end the page, so a
 * layout holds one of each pair at most (siteBlocks 'all'). Returns the
 * problem, or null.
 */
export const doublesProblem = (layout: unknown): string | null => {
  const rows = rowsShown(layout)
  const pairs: [string, string, string][] = [
    ['faq', 'faqSection', 'The FAQ block and the FAQ section both send FAQ data to search engines, so a page has one FAQ.'],
    ['closingCta', 'closingSection', 'The closing call to action block and the closing panel section both end the page, so a page has one closing panel.'],
  ]
  for (const [blockType, sectionType, why] of pairs) {
    const found = rows.filter(({ block }) => block.blockType === blockType || block.blockType === sectionType)
    if (found.length > 1 && found.some(({ block }) => block.blockType === blockType)) {
      return `${why} Keep one: remove ${listed(found.slice(1).map(rowName))}, or ${rowName(found[0])}.`
    }
  }
  return null
}

const layoutRule: Validate = async (value, options) => {
  const builtIn = await validateBlocks(value as any, options as any)
  if (builtIn !== true) return builtIn
  // The sections this collection lets use navy, by label, for the message.
  const entry = getContentCollection(String((options as { collectionSlug?: string }).collectionSlug ?? ''))
  const allowed = (entry?.sections ?? [])
    .map((key) => getSection(key))
    .filter((d) => d?.navyAllowed)
    .map((d) => (d!.key === 'closing' ? 'closing panel' : d!.label.toLowerCase()))
  const data = (options as { data?: { showClosing?: unknown; heroDesign?: unknown; usePageDefaults?: unknown } }).data
  const freeBlocks = Boolean(entry?.freeLayout)
  return (
    navyProblem(value, { allowed: allowed.length ? allowed : undefined, showsClosing: data?.showClosing === true, freeBlocks }) ??
    placementProblem(value) ??
    (freeBlocks ? heroProblem(value, { blockHero: data?.heroDesign === 'blockHero', usesDefaults: data?.usePageDefaults !== false }) : null) ??
    (freeBlocks ? doublesProblem(value) : null) ??
    true
  )
}

export { isLayoutCondition, whileLayoutHas } from './layoutTabs'

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
  const wanted = [...new Set(rows.flatMap((r) => (typeof r === 'object' && 'sharedContent' in r ? [r.sharedContent] : [])))]
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
    if ('block' in row) return [{ ...row.fields, blockType: row.block }]
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
  allow = [],
}: {
  name: string
  label: string
  references: string[]
  description: string
  /** Named in config errors. */
  owner: string
  /** Blocks of NEVER_IN_LAYOUT this layout offers anyway, under its own rules (siteBlocks 'all'). */
  allow?: readonly string[]
}): BlocksField => {
  const banned = references.filter((slug) => (NEVER_IN_LAYOUT as readonly string[]).includes(slug) && !allow.includes(slug))
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
  siteBlocks = SITE_BLOCKS.map((b) => b.slug),
}: {
  collection: string
  /** Section keys editors may add, from the section registry. */
  sections: string[]
  /** The rows a new entry starts with, in order. */
  defaultLayout: DefaultLayoutRow[]
  /** The page blocks editors may add, by slug (the collection's siteBlocks). */
  siteBlocks?: string[]
}): { sidebar: CheckboxField; fields: Field[] } => {
  for (const key of sections) {
    if (!getSection(key)) throw new Error(`${collection}: no section is registered as ${key}.`)
  }
  for (const row of defaultLayout) {
    const key = defaultRowKey(row)
    const block = defaultRowBlock(row)
    if (key && !sections.includes(key)) {
      throw new Error(`${collection}: the default layout uses ${key}, which is not an allowed section.`)
    }
    if (block && !siteBlocks.includes(block)) {
      throw new Error(`${collection}: the default layout uses the ${block} block, which its layout does not offer.`)
    }
  }
  // A default holding page blocks is a starting point: their content is the
  // entry's own, so an entry does not follow the default unless switched on.
  const startsFromDefault = defaultLayout.some((row) => defaultRowBlock(row))

  const sidebar: CheckboxField = {
    name: 'usePageDefaults',
    type: 'checkbox',
    label: 'Use page defaults',
    defaultValue: !startsFromDefault,
    admin: {
      position: 'sidebar',
      condition: (data) => Boolean(data?.hasOwnPage),
      description: startsFromDefault
        ? 'Off (as a new page starts): the layout on the Page tab is this page\'s own, starting from the default. On: the page follows the default layout, and its blocks start empty again on the next save.'
        : 'On: the page follows the default layout, and changes to the default reach it. Off: the layout on the Page tab is this page\'s own.',
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
    references: [...sections.map(sectionBlockSlug), ...siteBlocks],
    description: siteBlocks.some((slug) => (HERO_BLOCKS as readonly string[]).includes(slug))
      ? "The page's sections and page blocks, in order. Drag to reorder, add any page block, remove any row. A hero block may only be the first row, with Hero design set to Hero block from the layout. Read-only while Use page defaults is on."
      : 'The sections between the page hero and the end of the page, in order. Drag to reorder. Read-only while Use page defaults is on.',
    owner: collection,
    // A free layout offers the layout heroes and the plain faq block, under its own rules.
    allow: [...LAYOUT_HERO_BLOCKS, 'faq'],
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
