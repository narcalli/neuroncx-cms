import type { Block } from 'payload'

import {
  cardEyebrowField,
  cardLookFields,
  cardNumberTextField,
  cardPointsFields,
  cardSwitchFields,
} from '@/fields/cardOptions'
import { iconField } from '@/fields/icons'

/**
 * A general-purpose card grid: a heading, an intro line, and 2 to 4 cards
 * in an even row. Not tied to any one product line — use it anywhere a
 * short "here's what this does" grid is needed. For the product navigation
 * grid specifically, use Product Suite instead.
 *
 * The cards use the same options as Bento Grid cards (number, eyebrow,
 * points, colour, border, accent line), plus an optional icon.
 */
export const ProductSuite2: Block = {
  slug: 'productSuite2',
  interfaceName: 'ProductSuite2Block',
  labels: { singular: 'Card Grid (Product Suite 2)', plural: 'Card Grids (Product Suite 2)' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the heading',
      admin: { description: 'Optional. Short, e.g. "Reports and prescriptions".' },
    },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 2,
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        cardLookFields('white'),
        iconField(),
        cardSwitchFields(),
        cardNumberTextField(),
        cardEyebrowField(),
        { name: 'title', type: 'text', required: true, label: 'Title' },
        { name: 'description', type: 'textarea', label: 'Description' },
        ...cardPointsFields(),
        {
          name: 'link',
          type: 'group',
          label: 'Link (optional)',
          admin: {
            hideGutter: true,
            description: 'Optional. Leave the address empty to show the card with no link.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Link text', admin: { width: '50%' } },
                { name: 'url', type: 'text', label: 'Link address', admin: { width: '50%' } },
              ],
            },
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
              defaultValue: false,
            },
          ],
        },
      ],
    },
  ],
}
