import type { ArrayField, CheckboxField, CollectionSlug, Condition, Field, GroupField, Tab, Validate } from 'payload'
import { text as validateText } from 'payload/shared'

import { chatExampleFields } from './chatExample'
import { showClosingField } from './closing'
import { countedText } from './counted'
import { BLOCK_HERO, FIELD_HERO_DESIGNS, heroDesignField, heroDesignOf, type HeroDesignName } from './heroDesign'
import { link } from './link'
import { heroCustomVisualFields } from '../blocks/HeroCustom/config'

/**
 * Own page group (fields_reference.md, section 4). Every entry starts as a
 * card; hasOwnPage promotes it to a page of its own without a schema change.
 *
 *   const page = ownPage('crmFeatures', { heroDesigns: ['conversation'] })
 *   page.sidebar  the hasOwnPage switch, for the sidebar
 *   page.tab      the Page tab, shown only while hasOwnPage is on
 *
 * The hero fields are written once and fed to whichever hero design the
 * entry picks (heroDesign); a field only one design uses shows only for it.
 * What each design needs to publish is in src/content/publishCheck.ts.
 *
 * While the tab is hidden its fields are not validated, so an entry without
 * a page can always be published.
 */

const heroHeadingRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  const data = options.data as { hasOwnPage?: boolean; _status?: string; heroDesign?: string } | undefined
  const empty = typeof value !== 'string' || !value.trim()
  if (data?.hasOwnPage && data?._status === 'published' && data?.heroDesign !== BLOCK_HERO && empty) {
    return 'Add a hero heading before publishing with Own page on.'
  }
  return true
}

// A list of short items: a title and one line each.
const titleAndLine = (
  name: string,
  label: string,
  labels: { singular: string; plural: string },
  rows: { minRows?: number; maxRows: number },
  description: string,
): ArrayField => ({
  name,
  type: 'array',
  label,
  labels,
  ...rows,
  admin: { description, initCollapsed: true },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 50 },
    { name: 'line', type: 'text', required: true, maxLength: 140 },
  ],
})

/** The entry's own hero fields, hidden while the hero is a block from the layout. */
const HERO_FIELDS = [
  'heroEyebrow',
  'heroHeading',
  'heroSubheading',
  'heroChips',
  'heroSecondaryCta',
  'heroChat',
  'heroChatCaption',
  'heroMedia',
  'heroMediaAlt',
  'heroWorkflowFromChain',
  'heroMotion',
  'heroStats',
]

/** A field at a share of its row, keeping its other admin settings (the counter). */
const withWidth = <T extends { admin?: object }>(field: T, width: string): T => ({ ...field, admin: { ...field.admin, width } })

/** A button that may be left empty: a label, and once there is one, where it goes. */
const button = (name: string, label: string, description: string): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { description },
  fields: [
    { name: 'label', type: 'text', maxLength: 30 },
    // Shown, and required, only once there is a label.
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        admin: { condition: (_: unknown, siblingData: any) => Boolean(siblingData?.label) },
      },
    }),
  ],
})

export const ownPage = (
  collection: CollectionSlug,
  {
    heroDesigns = FIELD_HERO_DESIGNS,
    defaultHeroDesign,
    startsWithPage = false,
  }: {
    heroDesigns?: readonly HeroDesignName[]
    defaultHeroDesign?: HeroDesignName
    /** A new entry starts with Own page on, so the Page tab is the one that opens. */
    startsWithPage?: boolean
  } = {},
): { sidebar: CheckboxField; tab: Tab } => {
  // Shown only while the entry's design (or the collection's default) is one of these.
  const forDesign =
    (...designs: HeroDesignName[]): Condition =>
    (data) =>
      designs.includes(heroDesignOf(data, heroDesigns))

  const sidebar: CheckboxField = {
    name: 'hasOwnPage',
    type: 'checkbox',
    label: 'Own page',
    defaultValue: startsWithPage,
    admin: {
      position: 'sidebar',
      description:
        'Gives this entry a page of its own and adds it to the sitemap. The Page tab appears while this is on.',
    },
  }

  const fields: Field[] = [
    heroDesignField(heroDesigns, defaultHeroDesign),
    countedText({
      name: 'heroEyebrow',
      label: 'Eyebrow (optional)',
      maxLength: 40,
      description: "The small line above the heading. Leave empty to use the grouping's name.",
    }),
    {
      name: 'heroHeading',
      type: 'text',
      label: 'Hero heading',
      maxLength: 70,
      validate: heroHeadingRule,
      admin: { description: 'The page heading. Needed to publish with Own page on.' },
    },
    { name: 'heroSubheading', type: 'textarea', label: 'Hero subheading', maxLength: 200 },
    {
      name: 'heroChips',
      type: 'array',
      label: 'Chips',
      labels: { singular: 'Chip', plural: 'Chips' },
      maxRows: 4,
      admin: { initCollapsed: true, description: "Up to 4 short labels in the hero. Leave empty to use the card's key points." },
      fields: [countedText({ name: 'label', label: 'Label', maxLength: 30, required: true })],
    },
    button('cta', 'Call to action', 'The main button, in the hero and the closing panel. Type a label to choose where it goes.'),
    button('heroSecondaryCta', 'Second button (optional)', 'A second button in the hero. Type a label to choose where it goes.'),
    ...chatExampleFields({
      agent: {
        name: 'entry',
        type: 'relationship',
        label: 'Agent label (optional)',
        relationTo: [collection],
        admin: { description: 'The entry that sends this message, named under the chat.' },
      },
      captionDescription: 'A line at the top of the chat, such as where it takes place.',
    }),
    {
      name: 'heroMedia',
      type: 'upload',
      label: 'Hero picture',
      relationTo: 'media',
      admin: { description: 'A flow graphic or screenshot. Needed for Picture on the right.' },
    },
    countedText({
      name: 'heroMediaAlt',
      label: 'Picture description (alt text)',
      maxLength: 160,
      description: "What the picture shows, for screen readers. Leave empty to use the picture's own alt text.",
    }),
    {
      name: 'heroWorkflowFromChain',
      type: 'checkbox',
      label: 'Show the chain under the chat',
      defaultValue: false,
      admin: {
        condition: forDesign('conversation'),
        description: 'Lists this entry and the entries in its chain (Passes to), by name and card icon, under the chat.',
      },
    },
    {
      name: 'heroMotion',
      type: 'select',
      label: 'Picture motion',
      defaultValue: 'on',
      options: [
        { label: 'On', value: 'on' },
        { label: 'Off', value: 'off' },
      ],
      admin: { condition: forDesign('rightPlacement'), description: 'The picture drifts in gently. Off keeps it still.' },
    },
    {
      name: 'heroStats',
      type: 'array',
      label: 'Stats',
      labels: { singular: 'Stat', plural: 'Stats' },
      maxRows: 4,
      admin: {
        initCollapsed: true,
        condition: forDesign('conversation', 'stats'),
        description: 'Real, defensible figures only. Stats needs 2 to 4; Conversation shows any under the hero.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            withWidth(countedText({ name: 'value', label: 'Value', maxLength: 12, required: true, description: 'Such as 40% or 2x.' }), '35%'),
            withWidth(countedText({ name: 'label', label: 'Label', maxLength: 40, required: true, description: 'What the number means.' }), '65%'),
          ],
        },
      ],
    },
    {
      // The Hero (custom CSS) block's visual fields, as they are on the block
      // (src/blocks/HeroCustom/config.ts), so the same rules check them.
      type: 'collapsible',
      label: 'Custom CSS visual',
      admin: {
        condition: forDesign('customCss'),
        description:
          'The visual beside the hero text, from your own HTML and CSS. The eyebrow, heading, subheading, chips and buttons above stay as they are. Needs the HTML and a screen reader description to publish.',
      },
      fields: heroCustomVisualFields,
    },
    titleAndLine(
      'benefits',
      'Benefits',
      { singular: 'Benefit', plural: 'Benefits' },
      { minRows: 3, maxRows: 6 },
      '3 to 6 outcomes, each with a short line.',
    ),
    titleAndLine(
      'howItWorks',
      'How it works',
      { singular: 'Step', plural: 'Steps' },
      { minRows: 3, maxRows: 5 },
      '3 to 5 steps, in order.',
    ),
    titleAndLine(
      'useCases',
      'Use cases',
      { singular: 'Use case', plural: 'Use cases' },
      { maxRows: 4 },
      'Up to 4, one per vertical where possible.',
    ),
    {
      name: 'related',
      type: 'relationship',
      relationTo: collection,
      hasMany: true,
      maxRows: 3,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        description: 'Up to 3. Leave empty to show other entries from this collection, by order.',
      },
    },
    showClosingField('Ends this page with the closing panel. Off by default.'),
  ]

  // Hero block from the layout draws the hero from the layout's first row,
  // so the entry's own hero fields are hidden (and, hidden, not validated).
  const ownHero = (field: Field): Field => {
    if (!('name' in field) || !HERO_FIELDS.includes(field.name)) return field
    const shown = field.admin?.condition
    return {
      ...field,
      admin: {
        ...field.admin,
        condition: (data, siblingData, ctx) => data?.heroDesign !== BLOCK_HERO && (shown ? shown(data, siblingData, ctx) : true),
      },
    } as Field
  }

  const tab: Tab = {
    label: 'Page',
    admin: { condition: (data) => Boolean(data?.hasOwnPage) },
    fields: fields.map(ownHero),
  }

  return { sidebar, tab }
}
