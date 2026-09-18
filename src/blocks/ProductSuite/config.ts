import type { Block } from 'payload'

export const ProductSuite: Block = {
  slug: 'productSuite',
  interfaceName: 'ProductSuiteBlock',
  labels: { singular: 'Product Suite', plural: 'Product Suites' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'products',
      type: 'array',
      label: 'Products',
      minRows: 1,
      maxRows: 6,
      admin: {
        description: 'Keep these matched to the main navigation so the site says one thing.',
        initCollapsed: true,
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Product name' },
        {
          name: 'summary',
          type: 'textarea',
          label: 'What it does',
          admin: { description: 'One or two plain sentences. Say what it does, not why it is good.' },
        },
        {
          name: 'points',
          type: 'array',
          label: 'Capabilities',
          maxRows: 5,
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'linkLabel', type: 'text', label: 'Link text', defaultValue: 'Read more' },
        {
          name: 'linkHref',
          type: 'text',
          label: 'Link address',
          admin: { description: 'For example /omnichannel-cx' },
        },
      ],
    },
  ],
}
