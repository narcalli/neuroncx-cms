import type { Condition, Field } from 'payload'

import { cardLookFields } from './cardOptions'

/**
 * "Card design": how a block draws its cards, chosen once for the whole
 * block. The option values match the design names in the website's card
 * library (neuroncx-website/src/components/cards/registry.ts).
 *
 * A block saved before this group existed has no stored value for any of it.
 * Payload fills each field's defaultValue on read, so such a block reads as
 * design grid, no fixed cards per row, last row left as is and no category
 * headings, and the website draws it as before.
 */

type Design = 'grid' | 'logoCard' | 'directory' | 'feature' | 'story' | 'pill'

const designIs =
  (...designs: Design[]): Condition =>
  (_data, siblingData) =>
    designs.includes((siblingData?.design || 'grid') as Design)

const designIsNot =
  (...designs: Design[]): Condition =>
  (_data, siblingData) =>
    !designs.includes((siblingData?.design || 'grid') as Design)

export const cardDesignFields = (): Field => ({
  name: 'cardDesign',
  type: 'group',
  label: 'Card design',
  fields: [
    {
      name: 'design',
      type: 'select',
      label: 'Design',
      required: true,
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Logo card', value: 'logoCard' },
        { label: 'Directory with filters', value: 'directory' },
        { label: 'Feature card', value: 'feature' },
        { label: 'Story card', value: 'story' },
        { label: 'Pill', value: 'pill' },
      ],
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
      defaultValue: 'leave',
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
      defaultValue: false,
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
      defaultValue: true,
      admin: { condition: designIs('logoCard') },
    },
  ],
})
