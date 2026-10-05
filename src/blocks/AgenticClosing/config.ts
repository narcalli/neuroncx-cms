import type { Block } from 'payload'

/**
 * Closing call to action on a soft animated gradient, with a button that
 * gently follows the cursor when it is near.
 */
export const AgenticClosing: Block = {
  slug: 'agenticClosing',
  interfaceName: 'AgenticClosingBlock',
  labels: { singular: 'Agentic Closing CTA', plural: 'Agentic Closing CTAs' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 120 },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Button text', required: true, admin: { width: '50%' } },
        { name: 'ctaUrl', type: 'text', label: 'Button address', required: true, admin: { width: '50%' } },
      ],
    },
  ],
}
