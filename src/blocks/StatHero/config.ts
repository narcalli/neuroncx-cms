import type { Block } from 'payload'

export const StatHero: Block = {
  slug: 'statHero',
  interfaceName: 'StatHeroBlock',
  labels: { singular: 'Hero with stats', plural: 'Heroes with stats' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      maxLength: 60,
      admin: { description: 'Small line above the headline. A short category statement, e.g. "AI automation for patient journeys".' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      maxLength: 120,
      admin: { description: 'The main statement. Six to nine words works best.' },
    },
    {
      name: 'subhead',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'One or two sentences explaining what the platform does and for whom.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'primaryLabel', type: 'text', defaultValue: 'Book a demo', maxLength: 40, admin: { width: '50%' } },
        { name: 'primaryLink', type: 'text', defaultValue: '/contact', maxLength: 300, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'secondaryLabel', type: 'text', maxLength: 40, admin: { width: '50%', description: 'Leave empty to hide the second button.' } },
        { name: 'secondaryLink', type: 'text', maxLength: 300, admin: { width: '50%' } },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      maxRows: 4,
      admin: { description: 'Headline numbers. Use real, defensible figures - three works best.' },
      fields: [
        { name: 'value', type: 'text', required: true, maxLength: 20, admin: { description: 'e.g. 40%, 2.5x, 14+' } },
        { name: 'label', type: 'text', required: true, maxLength: 40, admin: { description: 'What the number means, in three or four words.' } },
      ],
    },
  ],
}
