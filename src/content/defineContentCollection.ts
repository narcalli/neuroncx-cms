import type {
  CollectionConfig,
  CollectionSlug,
  Field,
  RelationshipField,
  Tab,
} from 'payload'

import { authenticated } from '../access/authenticated'
import { publicLiveOrPilot } from '../access/publicLiveOrPilot'
import type { ListType } from '../collections/Lists'
import { ITEM_CARD_DESIGNS, itemCardDesignField, type ItemCardDesignName } from '../fields/cardDesign'
import { BLOCK_HERO, FIELD_HERO_DESIGNS, HERO_DESIGN_NAMES, type HeroDesignName } from '../fields/heroDesign'
import { ALL_LAYOUT_BLOCK_SLUGS, SITE_BLOCKS } from './sections/siteBlocks'
import {
  cardTab,
  coreFields,
  detailTab,
  faqTab,
  kbaseTab,
  ownPage,
  seoTab,
  statusField,
  whatsappTab,
} from '../fields/shared'
import { withRag } from '../rag/with-rag'
import { layoutField } from '../fields/layout'
import { whileLayoutHas } from '../fields/layoutTabs'
import { pageMotionField } from '../fields/motion'
import { contentFallbacks, contentPublishCheck, followPageDefaults } from './fallbacks'
import { previewUrl } from '../utilities/generatePreviewPath'
import { entryPath, hubPagePath, registerContentCollection, type ContentCollectionEntry, type ContentRouting } from './registry'
import { entryPathField, noteEntryLivePath, redirectMovedEntry, refreshChildPaths } from './paths'
import './sections/shared'
import type { DefaultLayoutRow } from './sections/defineSection'
import { revalidateAfterChange, revalidateAfterDelete } from './revalidate'

/**
 * Builds a content collection from a short config (docs/cms/foundation.md,
 * section 4), so every collection gets the same access, tabs, fallbacks,
 * publish check, knowledge base wiring and revalidation, and appears in the
 * registry (src/content/registry.ts).
 *
 * Shared field names and limits come from src/fields/ and never change here.
 */

/** The shared field groups (fields_reference.md). core and card are always included. */
export type ContentGroup = 'core' | 'card' | 'detail' | 'ownPage' | 'faq' | 'whatsapp' | 'kbase'

/** Where a collection's own fields go: the sidebar or one of the tabs. */
export type ContentPlacement =
  | 'sidebar'
  | 'card'
  | 'detail'
  | 'page'
  | 'faq'
  | 'whatsapp'
  | 'kbase'

export type ContentCollectionOptions = {
  /** Payload slug, camelCase. Also the registry key. */
  slug: string
  /** Admin label. A string is used for both singular and plural. */
  label: string | { singular: string; plural: string }
  /** Sidebar group in the admin. Defaults to the plural label. */
  adminGroup?: string
  /**
   * Where entry pages live. Without one, entries are cards only and the
   * ownPage group is not allowed.
   * - A route base, such as '/crm': entries at /crm/{slug}, the hub at /crm.
   * - { entries: 'root' }: entries at /{slug}, with no hub address.
   * - { parent: { collection, field } }: entries at /{parent slug}/{slug},
   *   where the parent is the entry in `collection` that `field` links to.
   *   The field is added to the sidebar unless the collection defines it.
   * Root and parent routes store each entry's address in a read-only path
   * field; every route form is checked against all other site addresses.
   */
  route?: string | { entries: 'root' } | { parent: { collection: string; field: string } }
  /** The grouping: which Lists type, the field name, and whether it is required. */
  groupBy?: { listType: ListType; field: string; required?: boolean }
  groups: ContentGroup[]
  fields?: Partial<Record<ContentPlacement, Field[]>>
  /**
   * Sections editors may add to the entry's layout, by key. A section can
   * carry this collection's own default heading. Needs the ownPage group:
   * the layout is on the Page tab.
   */
  sections?: (string | { key: string; headingDefault: string })[]
  /**
   * The sections an entry page follows by default, in order. All of
   * `sections` when left out. A Shared content row names the record it
   * places by key: { key: 'shared', sharedContent: 'hosting' }.
   */
  defaultLayout?: DefaultLayoutRow[]
  /**
   * The page blocks an entry's layout offers besides its sections. Left out:
   * the shared set (SITE_BLOCKS). A list: that fixed set, by slug. 'all':
   * every block a Page's layout offers, from the same list a hub's layout
   * uses (src/content/sections/siteBlocks.ts), with the hero blocks for the
   * Hero block from the layout design and the plain faq block, each refused
   * where it would double the page's H1, FAQ data or closing panel.
   */
  siteBlocks?: 'all' | string[]
  /** The card designs an entry may pick. All item designs when left out. */
  cardDesigns?: ItemCardDesignName[]
  /** The hero designs an entry's own page may use. All of them when left out. Needs the ownPage group. */
  heroDesigns?: HeroDesignName[]
  kb?: { resolve?: string[]; exclude?: string[] }
  /** Extra Payload hooks, run after the factory's own. */
  hooks?: CollectionConfig['hooks']
  /** Tabs only this collection has, each placed straight after one of the fixed tabs. */
  extraTabs?: {
    after: ContentTab
    tab: Tab
    /**
     * With tabs 'page': the sections that read this tab's fields. The tab
     * shows only while one of them is in the entry's layout, and keeps its
     * data while hidden. Left out, the tab always shows.
     */
    readBy?: string[]
  }[]
  /**
   * The order of the tabs. 'fixed' (the default): Card, Detail, Page, FAQ,
   * WhatsApp, Knowledge base, SEO, each extra tab after the one it names.
   * 'page': edited like a Page. The Page tab first (the hero design and the
   * layout), then the extra tabs and the FAQ tab, each only while a section
   * reading it is in the layout, then Listing (the Card and Detail fields),
   * SEO, WhatsApp and Knowledge base. Needs the ownPage group and sections.
   */
  tabs?: 'fixed' | 'page'
  /** The hero design a new entry starts with. Conversation where allowed, else the first allowed, when left out. */
  defaultHeroDesign?: HeroDesignName
  /** Own page fields this collection leaves out, such as howItWorks when a panel replaces it. */
  ownPage?: { omit?: ('benefits' | 'howItWorks' | 'useCases')[] }
  /** List view columns and sort. The defaults suit most collections. */
  admin?: { defaultColumns?: string[]; defaultSort?: string | string[] }
  // TODO: whatsapp (menu order source, extra button actions), foundation.md section 4.2.
  // TODO: access (read override, only with a written reason in the brief), section 4.2.
}

const SITE_TAB_ORDER = ['card', 'detail', 'page', 'faq', 'whatsapp', 'kbase', 'seo'] as const

/** The fixed tabs, by key, in their order. */
export type ContentTab = (typeof SITE_TAB_ORDER)[number]

const ROUTE_PATTERN = /^\/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/

const inSidebar = (field: Field): Field =>
  ({ ...field, admin: { ...(field as { admin?: object }).admin, position: 'sidebar' } }) as Field

const withFields = (tab: Tab, extra: Field[] | undefined): Tab =>
  extra?.length ? { ...tab, fields: [...tab.fields, ...extra] } : tab

/** Every hook list from the factory, followed by the collection's own. */
const mergeHooks = (
  own: NonNullable<CollectionConfig['hooks']>,
  extra: CollectionConfig['hooks'] = {},
): CollectionConfig['hooks'] => {
  const merged: Record<string, unknown[]> = {}
  for (const key of new Set([...Object.keys(own), ...Object.keys(extra)])) {
    merged[key] = [
      ...((own as Record<string, unknown[]>)[key] ?? []),
      ...((extra as Record<string, unknown[]>)[key] ?? []),
    ]
  }
  return merged as CollectionConfig['hooks']
}

/** An entry's preview link: its own page, else the hub page that shows its card. */
const previewPathFor = (entry: ContentCollectionEntry, doc: Record<string, unknown>): string | null => {
  const path = entryPath(entry, doc) ?? hubPagePath(entry)
  return path ? previewUrl(path) : null
}

export const defineContentCollection = (opts: ContentCollectionOptions): CollectionConfig => {
  const { slug, groupBy, fields: extra = {} } = opts
  const groups = new Set<ContentGroup>(['core', 'card', ...opts.groups])
  const labels =
    typeof opts.label === 'string' ? { singular: opts.label, plural: opts.label } : opts.label
  const routing: ContentRouting =
    typeof opts.route === 'string'
      ? { kind: 'base', base: opts.route }
      : opts.route && 'entries' in opts.route
        ? { kind: 'root' }
        : opts.route && 'parent' in opts.route
          ? { kind: 'parent', collection: opts.route.parent.collection, field: opts.route.parent.field }
          : { kind: 'none' }
  // The hub's address and the base of entry addresses; only a route base has one.
  const route = routing.kind === 'base' ? routing.base : null

  // Mistakes in a config fail when the config loads, not on an editor's save.
  if (route !== null && !ROUTE_PATTERN.test(route)) {
    throw new Error(`${slug}: route must look like /crm or /bot-swarm, without a trailing slash.`)
  }
  if (groups.has('ownPage') && routing.kind === 'none') {
    throw new Error(`${slug}: the ownPage group needs a route.`)
  }
  if ((routing.kind === 'root' || routing.kind === 'parent') && !groups.has('ownPage')) {
    throw new Error(`${slug}: a root or parent route needs the ownPage group, since only own pages have an address.`)
  }
  if (routing.kind === 'parent') {
    if (routing.collection === slug) throw new Error(`${slug}: the parent collection must be another collection.`)
    if (!/^[a-z][a-zA-Z0-9]*$/.test(routing.collection) || !/^[a-z][a-zA-Z0-9]*$/.test(routing.field)) {
      throw new Error(`${slug}: route.parent needs a collection slug and a field name, in camelCase.`)
    }
  }
  if (extra.page?.length && !groups.has('ownPage')) {
    throw new Error(`${slug}: fields.page needs the ownPage group.`)
  }
  const designs = opts.cardDesigns ?? [...ITEM_CARD_DESIGNS]
  if (!designs.length || designs.some((d) => !ITEM_CARD_DESIGNS.includes(d))) {
    throw new Error(`${slug}: cardDesigns must be one or more of ${ITEM_CARD_DESIGNS.join(', ')}.`)
  }

  if (opts.heroDesigns && !groups.has('ownPage')) {
    throw new Error(`${slug}: heroDesigns needs the ownPage group.`)
  }
  const siteBlocks = opts.siteBlocks ?? SITE_BLOCKS.map((b) => b.slug)
  if (Array.isArray(siteBlocks)) {
    const unknown = siteBlocks.filter((b) => !ALL_LAYOUT_BLOCK_SLUGS.includes(b))
    if (unknown.length) throw new Error(`${slug}: siteBlocks has blocks no layout may offer: ${unknown.join(', ')}.`)
  }
  const freeLayout = siteBlocks === 'all'
  // Hero block from the layout needs the hero blocks, which only 'all' offers.
  const heroDesigns = opts.heroDesigns ?? [...(freeLayout ? HERO_DESIGN_NAMES : FIELD_HERO_DESIGNS)]
  if (!heroDesigns.length || heroDesigns.some((d) => !HERO_DESIGN_NAMES.includes(d))) {
    throw new Error(`${slug}: heroDesigns must be one or more of ${HERO_DESIGN_NAMES.join(', ')}.`)
  }
  if (opts.defaultHeroDesign && !heroDesigns.includes(opts.defaultHeroDesign)) {
    throw new Error(`${slug}: defaultHeroDesign ${opts.defaultHeroDesign} is not one of its hero designs.`)
  }
  if (heroDesigns.includes(BLOCK_HERO) && !freeLayout) {
    throw new Error(`${slug}: the ${BLOCK_HERO} hero design needs siteBlocks: 'all', which offers the hero blocks.`)
  }

  const sectionKeys = (opts.sections ?? []).map((s) => (typeof s === 'string' ? s : s.key))
  if (sectionKeys.length && !groups.has('ownPage')) {
    throw new Error(`${slug}: sections need the ownPage group.`)
  }

  const entry: ContentCollectionEntry = {
    slug,
    label: labels,
    route,
    hasRoute: routing.kind !== 'none',
    routing,
    ownPage: groups.has('ownPage'),
    seo: groups.has('detail') || groups.has('ownPage'),
    grouping: groupBy
      ? { listType: groupBy.listType, field: groupBy.field, required: groupBy.required ?? false }
      : null,
    sections: sectionKeys,
    defaultLayout: opts.defaultLayout ?? sectionKeys,
    headings: Object.fromEntries(
      (opts.sections ?? []).flatMap((s) => (typeof s === 'string' ? [] : [[s.key, s.headingDefault]])),
    ),
    kbase: groups.has('kbase'),
    heroDesigns: groups.has('ownPage') ? heroDesigns : [],
    siteBlocks: freeLayout ? [...ALL_LAYOUT_BLOCK_SLUGS] : siteBlocks,
    freeLayout,
    kb: { resolve: opts.kb?.resolve ?? [], exclude: opts.kb?.exclude ?? [] },
  }
  const layout = sectionKeys.length
    ? layoutField({ collection: slug, sections: sectionKeys, defaultLayout: entry.defaultLayout, siteBlocks: entry.siteBlocks })
    : null

  /* Sidebar: name, slug, status, grouping, featured, order, isUSP, hasOwnPage, then the collection's own. */

  const core = coreFields()
  const afterSlug = core.findIndex((f) => 'name' in f && f.name === 'featured')
  const grouping: RelationshipField | null = groupBy
    ? {
        name: groupBy.field,
        type: 'relationship',
        relationTo: 'lists',
        required: groupBy.required ?? false,
        filterOptions: { type: { equals: groupBy.listType } },
        admin: {
          position: 'sidebar',
          sortOptions: 'order',
          description: 'Groups entries on the hub page and in WhatsApp menus.',
        },
      }
    : null
  if (opts.ownPage?.omit?.length && !groups.has('ownPage')) {
    throw new Error(`${slug}: ownPage.omit needs the ownPage group.`)
  }
  const omit = new Set<string>(opts.ownPage?.omit ?? [])
  const shared = groups.has('ownPage')
    ? ownPage(slug as CollectionSlug, {
        heroDesigns,
        defaultHeroDesign: opts.defaultHeroDesign,
        // Edited like a Page: a new entry opens on its Page tab.
        startsWithPage: opts.tabs === 'page',
      })
    : null
  const page = shared && {
    sidebar: shared.sidebar,
    tab: {
      ...shared.tab,
      fields: shared.tab.fields.filter((f) => !('name' in f && omit.has(f.name))),
    },
  }

  // A parent route links each entry to its parent: the collection's own field
  // when it defines one (a single relationship to the parent collection),
  // else one added to the sidebar.
  const parentLink = routing.kind === 'parent' ? routing : null
  const ownParentField = parentLink
    ? Object.values(extra)
        .flatMap((list) => list ?? [])
        .find((f) => 'name' in f && f.name === parentLink.field)
    : undefined
  if (parentLink && ownParentField) {
    const ok =
      ownParentField.type === 'relationship' &&
      ownParentField.relationTo === parentLink.collection &&
      !ownParentField.hasMany
    if (!ok) {
      throw new Error(`${slug}: ${parentLink.field} must be a single relationship to ${parentLink.collection}.`)
    }
  }
  const parentField: RelationshipField | null =
    parentLink && !ownParentField
      ? {
          name: parentLink.field,
          type: 'relationship',
          label: 'Parent (sets the address)',
          relationTo: parentLink.collection as CollectionSlug,
          required: true,
          admin: {
            position: 'sidebar',
            description: 'The entry this page sits under. Its address is the parent slug, then this slug.',
          },
        }
      : null
  // The stored address, after everything it is worked out from.
  const pathField = page && routing.kind !== 'none' ? entryPathField(entry) : null

  const sidebar: Field[] = [
    ...core.slice(0, afterSlug),
    statusField(),
    ...(grouping ? [grouping] : []),
    ...core.slice(afterSlug),
    ...(page ? [page.sidebar] : []),
    ...(layout ? [layout.sidebar] : []),
    // Animations on this entry's page: every collection with a route, current and future.
    ...(page && entry.hasRoute ? [pageMotionField()] : []),
    ...(parentField ? [parentField] : []),
    ...(extra.sidebar ?? []).map(inSidebar),
    ...(pathField ? [pathField] : []),
  ]

  /* Tabs, in the fixed order. A tab with no fields is left out. */

  const card = cardTab()
  const detail = detailTab()
  const cardDesign = itemCardDesignField({
    clearLabel: groupBy ? 'Follow the grouping' : 'Follow the section',
    description: groupBy
      ? "Leave empty to use the grouping's design, or the section's when the grouping has none."
      : "Leave empty to use the section's design.",
    designs,
  })
  const tabs: Record<(typeof SITE_TAB_ORDER)[number], Tab> = {
    card: withFields({ ...card, fields: [...card.fields, cardDesign] }, extra.card),
    detail: withFields(groups.has('detail') ? detail : { label: 'Detail', fields: [] }, extra.detail),
    page: page
      ? withFields(page.tab, [...(extra.page ?? []), ...(layout?.fields ?? [])])
      : { label: 'Page', fields: [] },
    faq: withFields(groups.has('faq') ? faqTab() : { label: 'FAQ', fields: [] }, extra.faq),
    whatsapp: withFields(
      groups.has('whatsapp')
        ? whatsappTab({
            linkSetByHook: route
              ? `Set on save: the entry's own page when Own page is on, otherwise its place on ${route}.`
              : entry.hasRoute
                ? "Set on save: the entry's own page when Own page is on, otherwise left empty."
                : 'Left empty: entries in this collection have no page to link to.',
          })
        : { label: 'WhatsApp', fields: [] },
      extra.whatsapp,
    ),
    kbase: withFields(
      groups.has('kbase') ? kbaseTab() : { label: 'Knowledge base', fields: [] },
      extra.kbase,
    ),
    // Detail and SEO are one group in fields_reference.md, and an own page
    // needs its SEO title and description to publish.
    seo: groups.has('detail') || groups.has('ownPage') ? seoTab() : { label: 'SEO', fields: [] },
  }
  const hasTab = (key: ContentTab) => tabs[key].fields.length > 0
  for (const { after, tab } of opts.extraTabs ?? []) {
    if (!hasTab(after)) throw new Error(`${slug}: an extra tab follows ${after}, which this collection does not have.`)
  }
  const fixedTabs = () =>
    SITE_TAB_ORDER.flatMap((key) =>
      hasTab(key) ? [tabs[key], ...(opts.extraTabs ?? []).filter((t) => t.after === key).map((t) => t.tab)] : [],
    )
  // Edited like a Page: the layout first, the field tabs only while a section reads them.
  const pageTabs = () => {
    if (!page || !layout) throw new Error(`${slug}: tabs 'page' needs the ownPage group and sections.`)
    const whileRead = (tab: Tab, readBy?: string[]): Tab =>
      readBy?.length ? ({ ...tab, admin: { ...tab.admin, condition: whileLayoutHas(readBy) } } as Tab) : tab
    const listing: Tab = {
      label: 'Listing',
      description: 'How this entry is listed on cards and hub pages.',
      fields: [...tabs.card.fields, ...(hasTab('detail') ? tabs.detail.fields : [])],
    }
    return [
      tabs.page,
      ...(opts.extraTabs ?? []).map((t) => whileRead(t.tab, t.readBy)),
      ...(hasTab('faq') ? [whileRead(tabs.faq, ['faq'])] : []),
      listing,
      ...(['seo', 'whatsapp', 'kbase'] as const).filter(hasTab).map((key) => tabs[key]),
    ]
  }
  const shownTabs = opts.tabs === 'page' ? pageTabs() : fixedTabs()

  const config: CollectionConfig = {
    slug,
    labels,
    access: {
      create: authenticated,
      delete: authenticated,
      read: publicLiveOrPilot,
      update: authenticated,
    },
    admin: {
      useAsTitle: 'name',
      group: opts.adminGroup ?? labels.plural,
      defaultColumns: opts.admin?.defaultColumns ?? [
        'name',
        ...(groupBy ? [groupBy.field] : []),
        'status',
        ...(page ? ['hasOwnPage'] : []),
        'updatedAt',
      ],
      listSearchableFields: ['name', 'slug'],
      // Preview button and live preview (foundation.md section 5.4): the
      // entry's own page, else its card on the hub page, in draft mode.
      ...(entry.hasRoute
        ? {
            livePreview: { url: ({ data }: { data: Record<string, any> }) => previewPathFor(entry, data) },
            preview: (doc: Record<string, unknown>) => previewPathFor(entry, doc),
          }
        : {}),
    },
    defaultSort: opts.admin?.defaultSort ?? 'order',
    versions: { drafts: { autosave: false } },
    fields: [...sidebar, { type: 'tabs', tabs: shownTabs }],
    hooks: mergeHooks(
      {
        beforeChange: [
          ...(layout ? [followPageDefaults(entry)] : []),
          contentFallbacks(entry, { seo: hasTab('seo'), whatsapp: groups.has('whatsapp') }),
          contentPublishCheck(entry),
          ...(entry.hasRoute ? [noteEntryLivePath(entry)] : []),
        ],
        afterChange: [
          revalidateAfterChange(entry),
          ...(entry.hasRoute ? [redirectMovedEntry(entry)] : []),
          refreshChildPaths(entry),
        ],
        afterDelete: [revalidateAfterDelete(entry)],
      },
      opts.hooks,
    ),
  }

  registerContentCollection(entry)
  return groups.has('kbase') ? withRag(config) : config
}
