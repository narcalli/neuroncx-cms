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
import { contentFallbacks, contentPublishCheck, followPageDefaults } from './fallbacks'
import { previewUrl } from '../utilities/generatePreviewPath'
import { entryPath, hubPagePath, registerContentCollection, type ContentCollectionEntry } from './registry'
import './sections/shared'
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
   * Route base for entry pages and the hub, such as /crm. Without one,
   * entries are cards only and the ownPage group is not allowed.
   */
  route?: string
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
  /** The sections an entry page follows by default, in order. All of `sections` when left out. */
  defaultLayout?: string[]
  /** The card designs an entry may pick. All item designs when left out. */
  cardDesigns?: ItemCardDesignName[]
  kb?: { resolve?: string[]; exclude?: string[] }
  /** Extra Payload hooks, run after the factory's own. */
  hooks?: CollectionConfig['hooks']
  /** Tabs only this collection has, each placed straight after one of the fixed tabs. */
  extraTabs?: { after: ContentTab; tab: Tab }[]
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
  const route = opts.route ?? null

  // Mistakes in a config fail when the config loads, not on an editor's save.
  if (route !== null && !ROUTE_PATTERN.test(route)) {
    throw new Error(`${slug}: route must look like /crm or /bot-swarm, without a trailing slash.`)
  }
  if (groups.has('ownPage') && !route) {
    throw new Error(`${slug}: the ownPage group needs a route.`)
  }
  if (extra.page?.length && !groups.has('ownPage')) {
    throw new Error(`${slug}: fields.page needs the ownPage group.`)
  }
  const designs = opts.cardDesigns ?? [...ITEM_CARD_DESIGNS]
  if (!designs.length || designs.some((d) => !ITEM_CARD_DESIGNS.includes(d))) {
    throw new Error(`${slug}: cardDesigns must be one or more of ${ITEM_CARD_DESIGNS.join(', ')}.`)
  }

  const sectionKeys = (opts.sections ?? []).map((s) => (typeof s === 'string' ? s : s.key))
  if (sectionKeys.length && !groups.has('ownPage')) {
    throw new Error(`${slug}: sections need the ownPage group.`)
  }

  const entry: ContentCollectionEntry = {
    slug,
    label: labels,
    route,
    hasRoute: route !== null,
    grouping: groupBy
      ? { listType: groupBy.listType, field: groupBy.field, required: groupBy.required ?? false }
      : null,
    sections: sectionKeys,
    defaultLayout: opts.defaultLayout ?? sectionKeys,
    headings: Object.fromEntries(
      (opts.sections ?? []).flatMap((s) => (typeof s === 'string' ? [] : [[s.key, s.headingDefault]])),
    ),
    kbase: groups.has('kbase'),
    kb: { resolve: opts.kb?.resolve ?? [], exclude: opts.kb?.exclude ?? [] },
  }
  const layout = sectionKeys.length
    ? layoutField({ collection: slug, sections: sectionKeys, defaultLayout: entry.defaultLayout })
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
  const shared = groups.has('ownPage') ? ownPage(slug as CollectionSlug) : null
  const page = shared && {
    sidebar: shared.sidebar,
    tab: {
      ...shared.tab,
      fields: shared.tab.fields.filter((f) => !('name' in f && omit.has(f.name))),
    },
  }

  const sidebar: Field[] = [
    ...core.slice(0, afterSlug),
    statusField(),
    ...(grouping ? [grouping] : []),
    ...core.slice(afterSlug),
    ...(page ? [page.sidebar] : []),
    ...(layout ? [layout.sidebar] : []),
    ...(extra.sidebar ?? []).map(inSidebar),
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
  const shownTabs = SITE_TAB_ORDER.flatMap((key) =>
    hasTab(key)
      ? [tabs[key], ...(opts.extraTabs ?? []).filter((t) => t.after === key).map((t) => t.tab)]
      : [],
  )

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
      ...(route
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
        ],
        afterChange: [revalidateAfterChange(entry)],
        afterDelete: [revalidateAfterDelete(entry)],
      },
      opts.hooks,
    ),
  }

  registerContentCollection(entry)
  return groups.has('kbase') ? withRag(config) : config
}
