import type { Block } from 'payload'

/**
 * A two-column section: a sticky left column (eyebrow, heading, intro and an
 * optional numbered indicator list) beside a vertical stack of numbered cards.
 * The card nearest the middle of the viewport becomes active as the reader
 * scrolls. The active state is decoration only; no content is hidden by it.
 */
export const PlatformLayersTwo: Block = {
  slug: 'platformLayersTwo',
  interfaceName: 'PlatformLayersTwoBlock',
  labels: { singular: 'Platform Layers 2 (Scroll Stack)', plural: 'Platform Layers 2 (Scroll Stack)' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow',
      maxLength: 60,
      admin: { description: 'Short uppercase label above the heading. Optional.' },
    },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 500 },
    {
      name: 'theme',
      type: 'select',
      label: 'Theme',
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Navy', value: 'navy' },
      ],
      admin: { description: 'Navy inverts the heading and body text. Cards stay light.' },
    },
    {
      name: 'showIndicators',
      type: 'checkbox',
      label: 'Show indicators',
      defaultValue: true,
      admin: {
        description: 'Shows the numbered list in the sticky left column on large screens',
      },
    },
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor ID',
      admin: { description: 'Optional. Lets a link such as #platform-stack jump to this block.' },
    },
    {
      name: 'layers',
      type: 'array',
      label: 'Layers',
      required: true,
      minRows: 3,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Numbered in the order listed. Three to six layers.',
        components: {
          RowLabel: '@/blocks/PlatformLayersTwo/RowLabel#PlatformLayersTwoRowLabel',
        },
      },
      fields: [
        { name: 'title', type: 'text', label: 'Title', required: true, maxLength: 90 },
        {
          name: 'tag',
          type: 'text',
          label: 'Tag pill',
          maxLength: 40,
          admin: { description: 'Short pill label such as "Unified Ingestion". Optional.' },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: true,
          maxLength: 300,
          admin: { description: 'One or two sentences, roughly 20 to 35 words' },
        },
        {
          name: 'footnote',
          type: 'text',
          label: 'Footnote',
          maxLength: 120,
          admin: { description: 'Small line with a tick icon under the description. Optional.' },
        },
        {
          name: 'link',
          type: 'group',
          label: 'Link',
          admin: { description: 'Optional link shown in the card foot.' },
          fields: [
            { name: 'label', type: 'text', label: 'Link text', maxLength: 60 },
            {
              name: 'type',
              type: 'radio',
              label: 'Link type',
              defaultValue: 'internal',
              options: [
                { label: 'Internal page', value: 'internal' },
                { label: 'External URL', value: 'external' },
              ],
              admin: { layout: 'horizontal' },
            },
            {
              name: 'page',
              type: 'relationship',
              label: 'Page',
              relationTo: 'pages',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'internal',
              },
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'external',
              },
            },
          ],
        },
      ],
    },
  ],
}
