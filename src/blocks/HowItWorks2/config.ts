import type { Block } from 'payload'

/**
 * How it works 2: numbered circles on a line, one column per step. The
 * original How it works block (blocks/HowItWorks) stays as it is. This one
 * never shows a button.
 */
export const HowItWorks2: Block = {
  slug: 'howItWorks2',
  interfaceName: 'HowItWorks2Block',
  labels: { singular: 'How it works 2', plural: 'How it works 2 sections' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow (optional)',
      maxLength: 40,
      admin: { description: 'Small line above the heading.' },
    },
    { name: 'heading', type: 'text', required: true, maxLength: 70, admin: { description: 'The section heading.' } },
    { name: 'intro', type: 'textarea', label: 'Intro (optional)', maxLength: 200 },
    {
      name: 'steps',
      type: 'array',
      minRows: 2,
      maxRows: 5,
      labels: { singular: 'Step', plural: 'Steps' },
      admin: {
        description: '2 to 5 steps, in order. The numbers 01, 02 and so on come from the order, so leave them out of the titles.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 30 },
        { name: 'description', type: 'textarea', required: true, maxLength: 140 },
      ],
    },
  ],
}
