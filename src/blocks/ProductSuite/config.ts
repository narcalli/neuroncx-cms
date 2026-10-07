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
          name: 'cardStyle',
          type: 'select',
          label: 'Card style',
          defaultValue: 'tags',
          options: [
            { label: 'Tags (small card in a grid)', value: 'tags' },
            { label: 'Steps (full width card with a numbered list)', value: 'steps' },
          ],
          admin: {
            description: 'Use Steps when the card explains a process. Use Tags for short labels.',
          },
        },
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
          admin: {
            description:
              'Tags style: short labels. Steps style: 3 to 5 steps, one line each, about 80 characters.',
          },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          admin: { description: 'Optional. Without an image the card shows text only.' },
        },
        {
          name: 'size',
          type: 'select',
          label: 'Card size',
          defaultValue: 'standard',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Wide (two columns)', value: 'wide' },
            { label: 'Tall (two rows)', value: 'tall' },
          ],
          admin: {
            description: 'Only for the Tags style. It is ignored on small screens.',
            condition: (_, siblingData) => siblingData?.cardStyle !== 'steps' && Boolean(siblingData?.image),
          },
        },
        {
          name: 'tint',
          type: 'select',
          label: 'Image background colour',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            // Values kept so existing pages keep rendering; the labels describe
            // what they now draw, which is a weight rather than a hue.
            { label: 'Cool (lightest)', value: 'violet' },
            { label: 'Teal', value: 'cyan' },
            { label: 'Rose', value: 'rose' },
            { label: 'Grey', value: 'grey' },
          ],
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.image),
          },
        },
        {
          name: 'teamControls',
          type: 'textarea',
          label: 'What your team controls',
          admin: {
            description: 'Shown in a small box under the steps.',
            condition: (_, siblingData) => siblingData?.cardStyle === 'steps',
          },
        },
        {
          name: 'note',
          type: 'text',
          label: 'Small note under the card',
          admin: {
            condition: (_, siblingData) => siblingData?.cardStyle === 'steps',
          },
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
