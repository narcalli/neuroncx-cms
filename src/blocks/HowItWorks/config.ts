import type { Block } from 'payload'

export const HowItWorks: Block = {
  slug: 'howItWorks',
  interfaceName: 'HowItWorksBlock',
  labels: { singular: 'How it works', plural: 'How it works sections' },
  fields: [
    { name: 'label', type: 'text', defaultValue: 'How it works', admin: { description: 'Small line above the heading.' } },
    { name: 'heading', type: 'text', required: true, admin: { description: 'The section heading.' } },
    { name: 'intro', type: 'textarea', maxLength: 260 },
    {
      name: 'steps',
      type: 'array',
      minRows: 2,
      maxRows: 5,
      admin: { description: 'Numbered automatically. Three steps is the readable maximum for most visitors.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true, maxLength: 260 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', admin: { width: '50%', description: 'Leave empty to hide the button.' } },
        { name: 'ctaLink', type: 'text', defaultValue: '/contact', admin: { width: '50%' } },
      ],
    },
  ],
}
