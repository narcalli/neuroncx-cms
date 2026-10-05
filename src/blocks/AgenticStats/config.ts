import type { Block } from 'payload'

/**
 * A row of headline numbers. Any number can be a count-up (animates from 0
 * to its value on view). Leave "Pending" ticked for a figure not yet
 * confirmed — it shows a shimmer placeholder and a "figure to confirm" tag.
 */
export const AgenticStats: Block = {
  slug: 'agenticStats',
  interfaceName: 'AgenticStatsBlock',
  labels: { singular: 'Agentic Stats', plural: 'Agentic Stats' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 80 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 140 },
    {
      name: 'stats',
      type: 'array',
      label: 'Stats',
      minRows: 1,
      maxRows: 4,
      fields: [
        {
          name: 'value',
          type: 'number',
          label: 'Value',
          admin: { description: 'The number, without a % or + sign.' },
        },
        {
          name: 'suffix',
          type: 'text',
          label: 'Suffix',
          maxLength: 6,
          admin: { description: 'For example %, +, k or x.' },
        },
        { name: 'label', type: 'text', label: 'Label', required: true, maxLength: 120 },
        {
          name: 'pending',
          type: 'checkbox',
          label: 'Pending (figure not yet confirmed)',
          defaultValue: false,
        },
      ],
    },
  ],
}
