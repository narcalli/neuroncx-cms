import type { Block } from 'payload'

/**
 * A compact trust strip: integration logos scrolling continuously in two
 * opposite-direction rows, pausing on hover. For the top or bottom of a
 * page, e.g. "Works with the tools you already pay for".
 */
export const IntegrationsMarquee: Block = {
  slug: 'integrationsMarquee',
  interfaceName: 'IntegrationsMarqueeBlock',
  labels: { singular: 'Integrations Marquee', plural: 'Integrations Marquees' },
  fields: [
    {
      type: 'collapsible',
      label: 'Section header',
      admin: {
        initCollapsed: false,
        description: 'Optional. Leave all three blank to render just the scrolling strip with no header above it.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
        { name: 'title', type: 'text', label: 'Title', maxLength: 100 },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 300 },
      ],
    },
    {
      name: 'logos',
      type: 'array',
      label: 'Logos',
      minRows: 4,
      maxRows: 40,
      admin: {
        initCollapsed: true,
        description:
          'Order matters. Roughly the first half renders in the top row scrolling one direction, the rest in the bottom row scrolling the other direction.',
        components: {
          RowLabel: '@/blocks/IntegrationsMarquee/RowLabel#IntegrationsMarqueeRowLabel',
        },
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: {
            description:
              'If left empty, a plain colored monogram using the first letter of the name is shown instead — useful while real logos are still being collected.',
          },
        },
        { name: 'name', type: 'text', label: 'Name', required: true, maxLength: 40 },
      ],
    },
  ],
}
