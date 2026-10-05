import type { Block } from 'payload'

import { iconField } from '@/fields/icons'

/**
 * Large-format "solution spotlight" cards — bigger and richer than Bento
 * Grid or Product Suite 2. Each card gets its own eyebrow, title, tagline,
 * description, an oversized watermark icon, a capped set of highlighted
 * points, and a CTA button.
 *
 * This format does not scale past 4 cards on a page, so the array is
 * capped at 4 rows.
 */
export const DetailedProductSuite: Block = {
  slug: 'detailedProductSuite',
  interfaceName: 'DetailedProductSuiteBlock',
  labels: { singular: 'Detailed Product Suite', plural: 'Detailed Product Suites' },
  fields: [
    {
      type: 'collapsible',
      label: 'Section header',
      admin: {
        initCollapsed: false,
        description: 'Optional. Leave all three blank to render just the card grid with no header above it.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
        { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 300 },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Cards per row',
      defaultValue: '2',
      options: [
        { label: '2 per row', value: '2' },
        { label: '1 per row', value: '1' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 1,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'This format does not scale past 4 cards on a page.',
        components: {
          RowLabel: '@/blocks/DetailedProductSuite/RowLabel#DetailedProductSuiteRowLabel',
        },
      },
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Eyebrow',
          maxLength: 40,
          admin: { description: 'Short, e.g. "Ready to deploy".' },
        },
        { name: 'title', type: 'text', label: 'Title', required: true, maxLength: 90 },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          maxLength: 80,
          admin: { description: 'The bold one-liner under the title, distinct from the description below.' },
        },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 300 },
        iconField(undefined, {
          name: 'watermarkIcon',
          label: 'Watermark icon',
          description: 'The large icon that floats above the card, drawn from the shared icon library.',
        }),
        {
          name: 'accentColor',
          type: 'select',
          label: 'Accent color',
          defaultValue: 'crimson',
          options: [
            { label: 'Crimson', value: 'crimson' },
            { label: 'Navy', value: 'navy' },
          ],
          admin: {
            description: "Drives the card's gradient tint, icon colors, and CTA button color together.",
          },
        },
        {
          name: 'highlights',
          type: 'array',
          label: 'Highlights',
          minRows: 0,
          maxRows: 8,
          admin: {
            initCollapsed: true,
            description:
              'First 4 show as icon tiles in a grid. Anything beyond that renders as a plain list below the grid instead. Order matters — your strongest points go first.',
            components: {
              RowLabel: '@/blocks/DetailedProductSuite/RowLabel#DetailedProductSuiteHighlightRowLabel',
            },
          },
          fields: [
            iconField(),
            { name: 'label', type: 'text', label: 'Label', required: true, maxLength: 60 },
          ],
        },
        {
          name: 'cta',
          type: 'group',
          label: 'CTA button',
          admin: { hideGutter: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Button text',
                  defaultValue: 'Explore the workflow',
                  admin: { width: '50%' },
                },
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
