import type { Block } from 'payload'

export const Integrations: Block = {
  slug: 'integrations',
  interfaceName: 'IntegrationsBlock',
  labels: { singular: 'Integrations', plural: 'Integrations' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'items',
      type: 'array',
      label: 'Integrations',
      minRows: 1,
      maxRows: 24,
      admin: { initCollapsed: true },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name' },
        {
          name: 'summary',
          type: 'text',
          label: 'One line',
          admin: { description: 'What flows between the two systems, in plain words.' },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo (optional)',
          admin: { description: 'Transparent PNG or SVG. Leave empty to show the name only.' },
        },
      ],
    },
    {
      name: 'footnote',
      type: 'text',
      label: 'Footnote',
      admin: { description: 'For example: anything else connects over our REST API and webhooks.' },
    },
  ],
}
