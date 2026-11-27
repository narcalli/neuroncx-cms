import type { Block } from 'payload'

export const Benefits: Block = {
  slug: 'benefits',
  interfaceName: 'BenefitsBlock',
  labels: { singular: 'Benefits', plural: 'Benefits' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading', maxLength: 40 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 140 },
    {
      name: 'items',
      type: 'array',
      label: 'Benefits',
      minRows: 2,
      maxRows: 6,
      admin: {
        description: 'Say what changes for the customer, not what the software contains.',
        initCollapsed: true,
      },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Benefit', maxLength: 60 },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 140 },
      ],
    },
  ],
}
