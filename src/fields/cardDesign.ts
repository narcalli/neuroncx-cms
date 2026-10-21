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
} as const

export type CardDesignName = keyof typeof DESIGNS

export const CARD_DESIGN_NAMES = Object.keys(DESIGNS) as CardDesignName[]

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
  showAllLink?: boolean | null
}

/**
 * What a block with no card design settings reads as. columns is null: no
 * fixed number per row, the cards fit the width.
 */
export const CARD_DESIGN_DEFAULTS = {
  design: 'grid',
  columns: null,
  lastRow: 'leave',
  groupByCategory: false,
  showAllLink: true,
} as const satisfies Omit<CardDesignValue, 'linkLabel' | 'look'>

export type CardDesignOptions = {
  /** The designs to offer, shown in the usual order. All six when left out. */
  designs?: CardDesignName[]
  /** The design a new block starts with. Must be one of `designs`. Grid when left out. */
  defaultDesign?: CardDesignName
}

export const cardDesignFields = ({
  designs = CARD_DESIGN_NAMES,
  defaultDesign = CARD_DESIGN_DEFAULTS.design,
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
        options: offered.map((value) => ({ label: DESIGNS[value], value })),
        admin: {
          // A small picture of each design instead of a dropdown.
          components: { Field: '@/fields/CardDesignPicker/Component#CardDesignPickerField' },
        },
      },
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
          description: 'Leave empty to fit as many as the width allows.',
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
          condition: designIs('feature', 'story'),
          description: 'Used only for integrations that have their own page.',
        },
      },
      {
        // Card colour, border and accent line, stored once for the whole block.
        name: 'look',
        type: 'group',
        label: false,
        admin: { condition: designIs('feature') },
        fields: [cardLookFields('white')],
      },
      {
        name: 'showAllLink',
        type: 'checkbox',
        label: "Add an 'All integrations' card at the end",
        defaultValue: CARD_DESIGN_DEFAULTS.showAllLink,
        admin: { condition: designIs('logoCard') },
      },
    ],
  }
}
