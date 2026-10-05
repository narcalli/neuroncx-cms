import type { Block, TextFieldSingleValidation } from 'payload'

import {
  cardEyebrowField,
  cardLookFields,
  cardNumberTextField,
  cardPointsFields,
  cardSwitchFields,
} from '@/fields/cardOptions'
import { iconField } from '@/fields/icons'

/**
 * A bento-style card grid on a 12 column grid. Editors control layout with
 * grid spans (1/4, 1/3, 1/2, ...) rather than pixel sizes, so a card can be
 * made tall or wide and smaller cards stack beside it. Card order in the
 * array is the drag-to-reorder order; with "dense" packing on, the browser
 * may still place a smaller card into an earlier gap, so the visual order
 * can differ from the list order.
 *
 * What a card contains (number, eyebrow, points, image) and how it looks
 * (colour, border, accent line) are separate choices, so any mix is possible.
 */
export const BentoGrid: Block = {
  slug: 'bentoGrid',
  interfaceName: 'BentoGridBlock',
  labels: { singular: 'Bento Grid', plural: 'Bento Grids' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'gap',
          type: 'select',
          label: 'Gap between cards',
          defaultValue: 'medium',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'rowHeight',
          type: 'number',
          label: 'Row height (px, desktop)',
          defaultValue: 240,
          min: 120,
          max: 600,
          admin: {
            width: '25%',
            description: 'The height of one grid row on desktop.',
          },
        },
        {
          name: 'dense',
          type: 'checkbox',
          label: 'Fill empty gaps automatically',
          defaultValue: false,
          admin: {
            width: '25%',
            description: 'Lets smaller cards move up into gaps. Visual order may differ from the list order.',
          },
        },
        {
          name: 'framed',
          type: 'checkbox',
          label: 'Show outer frame',
          defaultValue: true,
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Section header',
      admin: {
        initCollapsed: false,
        description: 'Optional. Leave all three blank to render just the cards, exactly as today.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
        { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 300 },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 1,
      maxRows: 12,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/BentoGrid/RowLabel#BentoGridRowLabel',
        },
      },
      fields: [
        {
          type: 'collapsible',
          label: 'Layout',
          admin: { initCollapsed: false },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'colSpan',
                  type: 'select',
                  label: 'Column span',
                  defaultValue: '4',
                  options: [
                    { label: '1/4 width', value: '3' },
                    { label: '1/3 width', value: '4' },
                    { label: '1/2 width', value: '6' },
                    { label: '2/3 width', value: '8' },
                    { label: '3/4 width', value: '9' },
                    { label: 'Full width', value: '12' },
                  ],
                  admin: { width: '33%' },
                },
                {
                  name: 'rowSpan',
                  type: 'select',
                  label: 'Row span',
                  defaultValue: '1',
                  options: [
                    { label: '1 row', value: '1' },
                    { label: '2 rows', value: '2' },
                    { label: '3 rows', value: '3' },
                  ],
                  admin: { width: '33%' },
                },
                {
                  name: 'tabletColSpan',
                  type: 'select',
                  label: 'Column span (tablet)',
                  defaultValue: 'auto',
                  options: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'Half', value: '6' },
                    { label: 'Full', value: '12' },
                  ],
                  admin: {
                    width: '33%',
                    description: 'Auto uses half width for cards up to 1/2, full width otherwise.',
                  },
                },
              ],
            },
          ],
        },
        // Red is a Bento Grid colour only; Product Suite 2 does not offer it.
        cardLookFields('grey', [{ label: 'Red', value: 'red' }]),
        // Optional: no default, so the picker offers "No icon".
        iconField(),
        cardSwitchFields(),
        cardNumberTextField(),
        cardEyebrowField(),
        { name: 'title', type: 'text', label: 'Title', required: true },
        {
          name: 'titleSize',
          type: 'select',
          label: 'Title size',
          defaultValue: 'regular',
          options: [
            { label: 'Large', value: 'large' },
            { label: 'Regular', value: 'regular' },
          ],
        },
        { name: 'body', type: 'textarea', label: 'Body text', maxLength: 400 },
        ...cardPointsFields(),
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
        {
          name: 'imagePosition',
          type: 'select',
          label: 'Image position',
          defaultValue: 'middle',
          options: [
            { label: 'Between title and text', value: 'middle' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Background with text on top', value: 'background' },
          ],
          admin: {
            condition: (_data, siblingData) => Boolean(siblingData?.image),
          },
        },
        {
          name: 'link',
          type: 'group',
          label: 'Link (optional)',
          admin: { hideGutter: true },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Link text', admin: { width: '50%' } },
                {
                  name: 'url',
                  type: 'text',
                  label: 'Link address',
                  admin: { width: '50%' },
                  validate: ((value, { siblingData }) => {
                    const label = (siblingData as { label?: string } | undefined)?.label
                    if (label && !value) return 'URL is required when link text is set.'
                    return true
                  }) as TextFieldSingleValidation,
                },
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
