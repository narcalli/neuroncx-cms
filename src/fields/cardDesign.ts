import type { Condition, Field } from 'payload'

import { cardLookFields } from './cardOptions'

/**
 * "Card design": how a block draws its cards, chosen once for the whole
 * block. The option values match the design names in the website's card
 * library (neuroncx-website/src/components/cards/registry.ts).
 *
 * A block saved before this group existed has no stored value for any of it.
 * Payload fills each field's defaultValue on read, so such a block reads as
 * CARD_DESIGN_DEFAULTS: design grid, no fixed cards per row, last row left as
 * is and no category headings, and the website draws it as before.
 */

/** Every design, in the order the picker shows them, with its label. */
const DESIGNS = {
  grid: 'Grid',
  logoCard: 'Logo card',
  directory: 'Directory with filters',
  feature: 'Feature card',
  story: 'Story card',
  pill: 'Pill',
  suite: 'Product suite: pills',
  suiteSteps: 'Product suite: steps',
  suite2: 'Product suite 2',
  detailedSuite: 'Detailed product suite',
  bento: 'Bento grid',
} as const

type AnyCardDesignName = keyof typeof DESIGNS

/**
 * The designs a card block offers. The section designs are not among them:
 * each draws a hub grouping as one whole section (SECTION_CARD_DESIGNS).
 */
export const CARD_DESIGN_NAMES = ['grid', 'logoCard', 'directory', 'feature', 'story', 'pill'] as const satisfies readonly AnyCardDesignName[]

export type CardDesignName = (typeof CARD_DESIGN_NAMES)[number]

/**
 * The designs one integration may choose for itself. Directory and pill
 * describe a whole list, so only a block can use them.
 */
export const ITEM_CARD_DESIGNS = ['grid', 'logoCard', 'feature', 'story'] as const satisfies readonly CardDesignName[]

export type ItemCardDesignName = (typeof ITEM_CARD_DESIGNS)[number]

/**
 * Designs that draw a hub grouping's whole section with one of the site's
 * blocks, one card per entry: Product suite (pills or steps), Product suite
 * 2, Detailed product suite and Bento grid.
 */
export const SECTION_CARD_DESIGNS = ['suite', 'suiteSteps', 'suite2', 'detailedSuite', 'bento'] as const satisfies readonly AnyCardDesignName[]

export type SectionCardDesignName = (typeof SECTION_CARD_DESIGNS)[number]

/** The designs a grouping section on a hub page offers: every block design and every section design. */
export const GROUPING_SECTION_CARD_DESIGNS = [...CARD_DESIGN_NAMES, ...SECTION_CARD_DESIGNS] as const

/** The designs a grouping (Lists) may choose: the item designs and the section designs. */
export const GROUPING_CARD_DESIGNS = [...ITEM_CARD_DESIGNS, ...SECTION_CARD_DESIGNS] as const

export type GroupingCardDesignName = (typeof GROUPING_CARD_DESIGNS)[number]

/** Select options for the given designs, in the usual order, with their labels. */
export const cardDesignOptions = (names: readonly AnyCardDesignName[]) =>
  (Object.keys(DESIGNS) as AnyCardDesignName[])
    .filter((d) => names.includes(d))
    .map((value) => ({ label: DESIGNS[value], value }))

/**
 * The card design an integration, or an integration category, may choose for
 * its cards: one of ITEM_CARD_DESIGNS, optional and with no default, shown as
 * the design pictures with a first tile that clears it. A card uses its
 * integration's design, else its category's, else the section's, wherever the
 * section lets integrations and categories use their own design.
 */
export const itemCardDesignField = ({
  clearLabel,
  description,
  designs = ITEM_CARD_DESIGNS,
  label = 'Card design',
}: {
  clearLabel: string
  description: string
  label?: string
  /** The designs to offer. All of ITEM_CARD_DESIGNS when left out. Groupings and hub sections add the section designs. */
  designs?: readonly AnyCardDesignName[]
}): Field => ({
  name: 'cardDesign',
  type: 'select',
  label,
  options: cardDesignOptions(designs),
  admin: {
    description,
    components: {
      Field: {
        path: '@/fields/CardDesignPicker/Component#CardDesignPickerField',
        clientProps: { clearLabel },
      },
    },
  },
})

/** The saved cardDesign value, as a block stores it and the API returns it. */
export type CardDesignValue = {
  design: CardDesignName
  /** Empty fits as many cards per row as the width allows. */
  columns?: ('2' | '3' | '4') | null
  lastRow?: ('stretch' | 'center' | 'leave') | null
  groupByCategory?: boolean | null
  linkLabel?: string | null
  look?: {
    cardColor?: ('grey' | 'lavender' | 'white') | null
    border?: ('none' | 'solid' | 'gradient') | null
    borderColor?: ('blue' | 'violet' | 'crimson' | 'navy') | null
    accentLine?: boolean | null
  }
  /** Only on groups built with allowItemDesigns. */
  allowItemDesigns?: boolean | null
}

/**
 * What a block with no card design settings reads as. columns is null: no
 * fixed number per row, the cards fit the width. allowItemDesigns applies
 * only where the group offers the switch.
 */
export const CARD_DESIGN_DEFAULTS = {
  design: 'grid',
  columns: null,
  lastRow: 'leave',
  groupByCategory: false,
  allowItemDesigns: true,
} as const satisfies Omit<CardDesignValue, 'linkLabel' | 'look'>

export type CardDesignOptions = {
  /** The designs to offer, shown in the usual order. All six when left out. */
  designs?: readonly CardDesignName[]
  /** The design a new block starts with. Must be one of `designs`. Grid when left out. */
  defaultDesign?: CardDesignName
  /**
   * Adds the "Let integrations and categories use their own design" switch,
   * for blocks whose cards are integrations (an integration, or its category,
   * may choose one of ITEM_CARD_DESIGNS). While it is on, the settings such a
   * design may need (the feature look, link text) show whatever the block's
   * design, except for directory and pill.
   */
  allowItemDesigns?: boolean
}

export const cardDesignFields = ({
  designs = CARD_DESIGN_NAMES,
  defaultDesign = CARD_DESIGN_DEFAULTS.design,
  allowItemDesigns = false,
}: CardDesignOptions = {}): Field => {
  const offered = CARD_DESIGN_NAMES.filter((d) => designs.includes(d))
  if (!offered.length) throw new Error('cardDesignFields: offer at least one design.')
  if (!offered.includes(defaultDesign)) {
    throw new Error(`cardDesignFields: the default design "${defaultDesign}" is not one of the offered designs.`)
  }

  // A design not chosen yet counts as the default one.
  const current = (siblingData: Record<string, unknown> | undefined): CardDesignName =>
    (siblingData?.design as CardDesignName) || defaultDesign
  const designIs =
    (...names: CardDesignName[]): Condition =>
    (_data, siblingData) =>
      names.includes(current(siblingData))
  const designIsNot =
    (...names: CardDesignName[]): Condition =>
    (_data, siblingData) =>
      !names.includes(current(siblingData))

  // With allowItemDesigns: while the switch is on (it is unless turned off),
  // integrations may bring their own design, so a setting that design needs
  // shows too. Directory and pill draw one whole list, so they never do.
  const itemsMayChoose = (siblingData: Record<string, unknown> | undefined) =>
    siblingData?.allowItemDesigns !== false && !['directory', 'pill'].includes(current(siblingData))
  const orForItems = (base: Condition): Condition =>
    allowItemDesigns ? (data, siblingData, ctx) => base(data, siblingData, ctx) || itemsMayChoose(siblingData) : base

  return {
    name: 'cardDesign',
    type: 'group',
    label: 'Card design',
    fields: [
      {
        name: 'design',
        type: 'select',
        label: 'Design',
        required: true,
        defaultValue: defaultDesign,
        options: cardDesignOptions(offered),
        admin: {
          // A small picture of each design instead of a dropdown.
          components: { Field: '@/fields/CardDesignPicker/Component#CardDesignPickerField' },
        },
      },
      ...(allowItemDesigns
        ? [
            {
              name: 'allowItemDesigns',
              type: 'checkbox' as const,
              label: 'Let integrations and categories use their own design',
              defaultValue: CARD_DESIGN_DEFAULTS.allowItemDesigns,
              admin: {
                condition: designIsNot('directory', 'pill'),
                description: 'When off, every card uses the design above.',
              },
            },
          ]
        : []),
      {
        // No default: empty fits as many cards as the width allows, which is
        // how blocks saved before this group existed have always looked.
        name: 'columns',
        type: 'select',
        label: 'Cards per row',
        options: [
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
        ],
        admin: {
          condition: designIsNot('directory', 'pill'),
          description: allowItemDesigns
            ? 'Leave empty to fit as many as the width allows. If integrations use different designs and this is empty, every group shows 3 per row.'
            : 'Leave empty to fit as many as the width allows.',
        },
      },
      {
        name: 'lastRow',
        type: 'select',
        label: 'Last row',
        defaultValue: CARD_DESIGN_DEFAULTS.lastRow,
        options: [
          { label: 'Stretch to fill', value: 'stretch' },
          { label: 'Centre', value: 'center' },
          { label: 'Leave as is', value: 'leave' },
        ],
        admin: { condition: designIs('grid') },
      },
      {
        name: 'groupByCategory',
        type: 'checkbox',
        label: 'Group by category',
        defaultValue: CARD_DESIGN_DEFAULTS.groupByCategory,
        admin: { description: 'Show a heading for each category.' },
      },
      {
        name: 'linkLabel',
        type: 'text',
        label: 'Link text',
        maxLength: 30,
        admin: {
          condition: orForItems(designIs('feature', 'story')),
          description: 'Used only for integrations that have their own page.',
        },
      },
      {
        // Card colour, border and accent line, stored once for the whole block.
        name: 'look',
        type: 'group',
        label: false,
        admin: { condition: orForItems(designIs('feature')) },
        fields: [cardLookFields('white')],
      },
    ],
  }
}
