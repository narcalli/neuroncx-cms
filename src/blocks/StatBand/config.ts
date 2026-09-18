import type { Block } from 'payload'

export const StatBand: Block = {
  slug: 'statBand',
  interfaceName: 'StatBandBlock',
  labels: { singular: 'Stat Band', plural: 'Stat Bands' },
  fields: [
    {
      name: 'stats',
      type: 'array',
      label: 'Figures',
      minRows: 2,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description:
          'Use figures you could defend if a prospect asked how you measured them. Three or four works best.',
      },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 4 industries, 1,300+' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'What the number means.' } },
      ],
    },
    {
      name: 'note',
      type: 'text',
      label: 'Footnote',
      admin: {
        description:
          'Optional. Use it to say how the figures are measured or over what period — not to disclaim them.',
      },
    },
  ],
}
