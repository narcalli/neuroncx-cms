import type { Condition, Field } from 'payload'

/**
 * The per-card options shared by every card-based block (Bento Grid,
 * Product Suite 2): what a card contains (number, eyebrow, points) and how
 * it looks (colour, border, accent line). Add an option here and it shows
 * up in both blocks.
 *
 * The website renders these with one shared card:
 *   neuroncx-website/src/components/blocks/OptionCard
 * Its types mirror the field names here — keep the two in step.
 *
 * Each export is a function so every block gets its own copy of the field.
 */

type CardColor = 'grey' | 'lavender' | 'white'

const numberOn: Condition = (_data, siblingData) => Boolean(siblingData?.showNumber)
// Cards saved before this checkbox existed have no value and show their eyebrow.
const eyebrowOn: Condition = (_data, siblingData) => siblingData?.showEyebrow !== false
const pointsOn: Condition = (_data, siblingData) => Boolean(siblingData?.showPoints)

/**
 * "Look" section: card colour, border style, border colour, accent line.
 * `extraColors` adds card colours for one block only, after the shared ones.
 */
export const cardLookFields = (
  defaultColor: CardColor = 'grey',
  extraColors: { label: string; value: string }[] = [],
): Field => ({
  type: 'collapsible',
  label: 'Look',
  admin: { initCollapsed: false },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'cardColor',
          type: 'select',
          label: 'Card colour',
          defaultValue: defaultColor,
          options: [
            { label: 'Grey', value: 'grey' },
            { label: 'Lavender', value: 'lavender' },
            { label: 'White with shadow', value: 'white' },
            ...extraColors,
          ],
          admin: { width: '33%' },
        },
        {
          name: 'border',
          type: 'select',
          label: 'Border style',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Solid', value: 'solid' },
            { label: 'Gradient (violet to blue)', value: 'gradient' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'borderColor',
          type: 'select',
          label: 'Border colour',
          defaultValue: 'blue',
          options: [
            { label: 'Blue', value: 'blue' },
            { label: 'Violet', value: 'violet' },
            { label: 'Crimson', value: 'crimson' },
            { label: 'Navy', value: 'navy' },
          ],
          admin: {
            width: '33%',
            condition: (_data, siblingData) => siblingData?.border === 'solid',
          },
        },
      ],
    },
    {
      name: 'accentLine',
      type: 'checkbox',
      label: 'Show accent line at bottom',
      defaultValue: false,
      admin: {
        description: 'A thin rule under the content, matches the border color.',
      },
    },
  ],
})

/** The three content switches, in one row. */
export const cardSwitchFields = (): Field => ({
  type: 'row',
  fields: [
    {
      name: 'showNumber',
      type: 'checkbox',
      label: 'Show number',
      defaultValue: false,
      admin: { width: '33%' },
    },
    {
      name: 'showEyebrow',
      type: 'checkbox',
      label: 'Show eyebrow',
      defaultValue: true,
      admin: { width: '33%' },
    },
    {
      name: 'showPoints',
      type: 'checkbox',
      label: 'Show points',
      defaultValue: false,
      admin: { width: '33%' },
    },
  ],
})

/** Optional text in place of the automatic 01, 02, ... Shown when "Show number" is on. */
export const cardNumberTextField = (): Field => ({
  name: 'numberText',
  type: 'text',
  label: 'Number text',
  maxLength: 8,
  admin: {
    condition: numberOn,
    description:
      'Leave empty to count automatically (01, 02, ...) across the cards that show a number. Fill in to show your own, e.g. "A" or "Step 1"; that card is then skipped in the count.',
  },
})

/** The eyebrow pill text. Shown when "Show eyebrow" is on. */
export const cardEyebrowField = (): Field => ({
  name: 'tag',
  type: 'text',
  label: 'Eyebrow text',
  maxLength: 40,
  admin: {
    condition: eyebrowOn,
    description: 'Small pill label above the title, e.g. "Tier 1 core".',
  },
})

/** The points list and its pills/bullets choice. Shown when "Show points" is on. */
export const cardPointsFields = (): Field[] => [
  {
    name: 'points',
    type: 'array',
    label: 'Points',
    labels: { singular: 'Point', plural: 'Points' },
    maxRows: 8,
    admin: {
      condition: pointsOn,
      description: 'Short lines shown under the text, as pills or as a bulleted list.',
    },
    fields: [{ name: 'text', type: 'text', label: 'Text', required: true, maxLength: 120 }],
  },
  {
    name: 'listStyle',
    type: 'select',
    label: 'Points shown as',
    defaultValue: 'pills',
    options: [
      { label: 'Pills', value: 'pills' },
      { label: 'Bullets', value: 'bullets' },
    ],
    admin: { condition: pointsOn },
  },
]
