import type {
  ArrayField,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  Field,
  Tab,
} from 'payload'
import { array as validateArray } from 'payload/shared'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { contentCollections, getContentCollection, hubPagePath } from '../../content/registry'
import { previewUrl } from '../../utilities/generatePreviewPath'
import { revalidateContent } from '../../content/revalidate'
import { allSections, sectionBlockSlug } from '../../content/sections/defineSection'
import { HUB_SECTION_KEYS, hubEntries } from '../../content/sections/hub'
import { SITE_BLOCKS } from '../../content/sections/siteBlocks'
import { GROUPING_SECTION_CARD_DESIGNS, itemCardDesignField } from '../../fields/cardDesign'
import { slugRule } from '../../fields/core'
import { countedText } from '../../fields/counted'
import { faqTab } from '../../fields/faq'
import { kbaseTab } from '../../fields/kbase'
import { sectionBlocksField } from '../../fields/layout'
import { optionalCta } from '../../fields/optionalCta'
import { integrationSeoTab } from '../integrations/seo'
import { withRag } from '../../rag/with-rag'

/**
 * Hubs: one record per content collection, holding its hub page and what its
 * entry pages share (docs/cms/foundation.md section 6.1). Replaces a master
 * collection per content collection; integrationsMaster moves in later.
 *
 * A function, called in payload.config.ts once every content collection has
 * registered: the collection picker and the entry relationships list them.
 *
 * Button names: the hero's are heroCta and heroSecondaryCta, the closing's
 * closing.cta and closing.secondaryCta, so the two pairs never clash.
 */

/** One row per value of `key`, with the label of the clash. */
const oncePer =
  (key: string, what: string): ArrayField['validate'] =>
  (value, options) => {
    const builtIn = validateArray(value, options)
    if (builtIn !== true) return builtIn
    const seen = new Set<string>()
    for (const row of (value as Record<string, unknown>[] | null | undefined) ?? []) {
      const v = row?.[key]
      const id = v && typeof v === 'object' ? String((v as { id?: unknown }).id) : v ? String(v) : ''
      if (!id) continue
      if (seen.has(id)) return `Each ${what} can have one row only.`
      seen.add(id)
    }
    return true
  }

/**
 * A hub's defaults, labels and closing reach every entry page of its
 * collection, so a published change refreshes the hub's address and the
 * collection's cached content on the website.
 */
const revalidateHub =
  (reason: string) =>
  async ({ doc, previousDoc, req }: { doc: any; previousDoc?: any; req: any }) => {
    if (req.context?.disableRevalidate) return doc
    if (doc?._status !== 'published' && previousDoc?._status !== 'published' && reason !== 'deleted') return doc
    const route = getContentCollection(doc?.forCollection)?.route
    await revalidateContent({
      collection: doc?.forCollection,
      paths: route ? [route] : [],
      reason: `hub ${reason}`,
      logger: req.payload?.logger,
    })
    return doc
  }

const hubPreview = (doc: Record<string, any>): string | null => {
  const entry = getContentCollection(doc?.forCollection)
  const path = entry ? hubPagePath(entry) : null
  return path ? previewUrl(path) : null
}

export const buildHubs = (): CollectionConfig => {
  const collections = contentCollections()
  const entrySections = allSections().filter(
    (s) => !(HUB_SECTION_KEYS as readonly string[]).includes(s.key),
  )

  const sidebar: Field[] = [
    { name: 'name', type: 'text', required: true, maxLength: 60, admin: { position: 'sidebar' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 60,
      validate: slugRule,
      admin: { position: 'sidebar', description: 'Lowercase, dashes only, for example bot-swarm.' },
    },
    {
      name: 'forCollection',
      type: 'select',
      label: 'For collection',
      required: true,
      unique: true,
      options: collections.map((c) => ({ label: c.label.plural, value: c.slug })),
      admin: {
        position: 'sidebar',
        description: 'The content collection this hub is for. One hub per collection.',
      },
    },
    {
      name: 'isMain',
      type: 'checkbox',
      label: 'Is main',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: "The hub shown at the collection's address, such as /bot-swarm.",
      },
    },
  ]

  const hero: Tab = {
    label: 'Hero',
    fields: [
      {
        name: 'heroDesign',
        type: 'radio',
        label: 'Hero design',
        defaultValue: 'standard',
        options: [
          { label: 'Standard (light, with breadcrumbs)', value: 'standard' },
          { label: 'Conversation (chat on a gradient stage)', value: 'conversation' },
        ],
        admin: {
          layout: 'horizontal',
          description:
            'Conversation shows the chat as an animated thread, with the names of the entries that reply listed under it. It has no picture and no breadcrumbs.',
        },
      },
      countedText({ name: 'eyebrow', label: 'Eyebrow (optional)', maxLength: 40 }),
      countedText({ name: 'h1', label: 'Page heading (H1)', maxLength: 70, required: true }),
      countedText({ name: 'subheading', label: 'Subheading', textarea: true, maxLength: 200 }),
      {
        name: 'heroChips',
        type: 'array',
        label: 'Chips',
        labels: { singular: 'Chip', plural: 'Chips' },
        maxRows: 4,
        admin: { description: 'Up to 4 short labels under the subheading.' },
        fields: [countedText({ name: 'label', label: 'Label', maxLength: 30, required: true })],
      },
      {
        name: 'heroMedia',
        type: 'upload',
        label: 'Picture (optional)',
        relationTo: 'media',
        admin: {
          description: 'Shown instead of the chat when there is no chat.',
          condition: (data) => data?.heroDesign !== 'conversation',
        },
      },
      {
        name: 'heroChat',
        type: 'array',
        label: 'Chat',
        labels: { singular: 'Message', plural: 'Messages' },
        maxRows: 8,
        admin: {
          initCollapsed: true,
          description: 'Up to 8 messages. Label each reply with the entry that sends it.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'sender',
                type: 'select',
                required: true,
                defaultValue: 'customer',
                options: [
                  { label: 'Customer', value: 'customer' },
                  { label: 'Entry (agent)', value: 'entry' },
                  { label: 'Team member', value: 'team' },
                ],
                admin: { width: '30%' },
              },
              hubEntries('entry', 'Sent by', {
                one: true,
                admin: {
                  width: '70%',
                  condition: (_, siblingData) => siblingData?.sender === 'entry',
                },
              }),
            ],
          },
          {
            name: 'text',
            type: 'textarea',
            required: true,
            maxLength: 300,
            admin: { description: 'Demo details only, no real customer names or figures.' },
          },
        ],
      },
      countedText({
        name: 'heroChatCaption',
        label: 'Chat caption (optional)',
        maxLength: 80,
        description: 'Under the chat in the standard design, at the top of the chat in the conversation design.',
      }),
      optionalCta('heroCta', 'Main button'),
      optionalCta('heroSecondaryCta', 'Second button'),
    ],
  }

  const grouping: Tab = {
    label: 'Grouping sections',
    description:
      'One row per grouping, in page order. Left empty, the page shows every grouping in its own order, with its own name and intro.',
    fields: [
      {
        name: 'groupingSections',
        type: 'array',
        labels: { singular: 'Grouping section', plural: 'Grouping sections' },
        validate: oncePer('group', 'grouping'),
        admin: { initCollapsed: true },
        fields: [
          {
            name: 'group',
            type: 'relationship',
            label: 'Grouping',
            relationTo: 'lists',
            required: true,
            filterOptions: ({ data }) => {
              const listType = getContentCollection(data?.forCollection)?.grouping?.listType
              return listType ? { type: { equals: listType } } : false
            },
            admin: { sortOptions: 'order' },
          },
          countedText({ name: 'eyebrow', label: 'Eyebrow (optional)', maxLength: 60 }),
          countedText({ name: 'heading', label: 'Heading', maxLength: 70 }),
          countedText({ name: 'intro', label: 'Intro (optional)', textarea: true, maxLength: 200 }),
          itemCardDesignField({
            label: 'Card design (optional)',
            clearLabel: 'Follow the grouping',
            designs: GROUPING_SECTION_CARD_DESIGNS,
            description:
              "Leave empty to use the grouping's design, else the grid. The Product suite designs, Detailed product suite and Bento grid draw the whole section, and win over the grouping's choice. With a card grid design, an entry's or a grouping's own card design still wins where the design allows it.",
          }),
          {
            name: 'bentoPattern',
            type: 'select',
            label: 'Bento sizes',
            defaultValue: 'even',
            options: [
              { label: 'Even (rows of three or two)', value: 'even' },
              { label: 'Featured (first card large)', value: 'featured' },
              { label: 'Alternating (wide and narrow)', value: 'alternating' },
            ],
            admin: {
              condition: (_, siblingData) => siblingData?.cardDesign === 'bento',
              description: 'How the cards share the width. The order follows the entries.',
            },
          },
          hubEntries('entries', 'Entries (optional)', {
            description: 'Hand-picked, in order. Leave empty to show every live entry in the grouping.',
          }),
        ],
      },
    ],
  }

  const hubLayout: Tab = {
    label: 'Hub layout',
    fields: [
      sectionBlocksField({
        name: 'layout',
        label: 'Hub sections',
        references: [...HUB_SECTION_KEYS.map(sectionBlockSlug), ...SITE_BLOCKS.map((b) => b.slug)],
        description:
          'The hub page between the grouping sections and the FAQ, in order. The closing panel is fixed at the end.',
        owner: 'hubs',
      }),
    ],
  }

  const entryDefaults: Tab = {
    label: 'Entry defaults',
    description: "What every entry page in the collection follows while it uses the page defaults.",
    fields: [
      {
        ...sectionBlocksField({
          name: 'defaultLayout',
          label: 'Default entry layout',
          references: [...new Set(collections.flatMap((c) => c.sections))].map(sectionBlockSlug),
          description:
            "The sections every entry page draws while Use page defaults is on, in order. Only the collection's own sections are offered. The closing panel is fixed at the end. Applies once the hub is published.",
          owner: 'hubs',
        }),
        filterOptions: ({ data }: { data: Record<string, any> }) =>
          (getContentCollection(data?.forCollection)?.sections ?? []).map(sectionBlockSlug),
      },
      {
        name: 'labels',
        type: 'array',
        label: 'Section headings',
        labels: { singular: 'Heading', plural: 'Headings' },
        validate: oncePer('section', 'section'),
        admin: {
          initCollapsed: true,
          description:
            'Headings on every entry page, unless an entry sets its own. Use {name} for the entry name.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'section',
                type: 'select',
                required: true,
                options: entrySections.map((s) => ({ label: s.label, value: s.key })),
                admin: { width: '40%' },
              },
              (() => {
                const heading = countedText({ name: 'heading', label: 'Heading', maxLength: 70, required: true })
                return { ...heading, admin: { ...heading.admin, width: '60%' } }
              })(),
            ],
          },
        ],
      },
    ],
  }

  const closing: Tab = {
    label: 'Closing',
    fields: [
      {
        name: 'closing',
        type: 'group',
        label: 'Closing panel',
        admin: { description: 'The navy panel at the end of the hub and every entry page.' },
        fields: [
          countedText({ name: 'heading', label: 'Heading', maxLength: 70 }),
          countedText({ name: 'subheading', label: 'Subheading', textarea: true, maxLength: 200 }),
          optionalCta('cta', 'Main button'),
          optionalCta('secondaryCta', 'Second button'),
        ],
      },
    ],
  }

  const whatsapp: Tab = {
    label: 'WhatsApp',
    description: 'Plain text only. These limits are the ones WhatsApp enforces.',
    fields: [
      countedText({
        name: 'waIntro',
        label: 'Intro',
        textarea: true,
        maxLength: 1024,
        description: 'Sent before the menu. Aim for 300 characters.',
      }),
      countedText({
        name: 'waListButton',
        label: 'List button',
        maxLength: 20,
        description: 'The button that opens the menu.',
      }),
      countedText({
        name: 'waSectionTitle',
        label: 'Section title',
        maxLength: 24,
        description: 'The heading above the rows.',
      }),
      countedText({
        name: 'waFallback',
        label: 'Fallback',
        textarea: true,
        maxLength: 300,
        description: 'Sent when someone asks about something that is not listed.',
      }),
    ],
  }

  // withRag: a published hub's knowledge base answer and FAQ go to NCX (src/rag/content.ts).
  return withRag({
    slug: 'hubs',
    labels: { singular: 'Hub', plural: 'Hubs' },
    access: {
      create: authenticated,
      delete: authenticated,
      read: authenticatedOrPublished,
      update: authenticated,
    },
    admin: {
      useAsTitle: 'name',
      group: 'Site structure',
      defaultColumns: ['name', 'forCollection', 'isMain', 'updatedAt'],
      description: 'One hub page per content collection, and what its entry pages share.',
      // Preview button and live preview: the hub page, in draft mode.
      livePreview: { url: ({ data }) => hubPreview(data) },
      preview: (doc) => hubPreview(doc),
    },
    versions: { drafts: { autosave: false } },
    hooks: {
      afterChange: [revalidateHub('changed') as CollectionAfterChangeHook],
      afterDelete: [revalidateHub('deleted') as CollectionAfterDeleteHook],
    },
    fields: [
      ...sidebar,
      {
        type: 'tabs',
        tabs: [
          integrationSeoTab(),
          hero,
          grouping,
          hubLayout,
          entryDefaults,
          faqTab({ headingFallback: 'Questions about {name}' }),
          closing,
          whatsapp,
          kbaseTab(),
        ],
      },
    ],
  })
}
