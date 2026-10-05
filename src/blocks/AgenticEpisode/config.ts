import type { Block } from 'payload'

/**
 * "Some relationships run for months": a horizontal episode bar with points
 * along it. The bar fills on view; tapping a point shows what attaches there.
 */
export const AgenticEpisode: Block = {
  slug: 'agenticEpisode',
  interfaceName: 'AgenticEpisodeBlock',
  labels: { singular: 'Episode Timeline', plural: 'Episode Timelines' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    {
      name: 'intro',
      type: 'array',
      label: 'Intro paragraphs',
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [{ name: 'text', type: 'textarea', label: 'Paragraph', required: true, maxLength: 500 }],
    },
    { name: 'startLabel', type: 'text', label: 'Start label', defaultValue: 'Episode open', maxLength: 30 },
    { name: 'endLabel', type: 'text', label: 'End label', defaultValue: 'Episode closes', maxLength: 30 },
    {
      name: 'points',
      type: 'array',
      label: 'Points along the episode',
      minRows: 2,
      maxRows: 8,
      admin: {
        initCollapsed: true,
        description: 'Evenly spaced from start to end, in the order entered.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Point label', required: true, maxLength: 40 },
        { name: 'caption', type: 'text', label: 'What attaches here', required: true, maxLength: 140 },
      ],
    },
    { name: 'closing', type: 'text', label: 'Caption under the bar', maxLength: 160 },
  ],
}
