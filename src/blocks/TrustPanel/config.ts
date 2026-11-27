import type { Block } from 'payload'
import { iconField } from '@/fields/icons'

export const TrustPanel: Block = {
  slug: 'trustPanel',
  interfaceName: 'TrustPanelBlock',
  labels: { singular: 'Trust Panel', plural: 'Trust Panels' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', maxLength: 60, admin: { description: 'e.g. Deployment & trust' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading', maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro paragraph', maxLength: 300 },
    { name: 'buttonLabel', type: 'text', label: 'Button text', maxLength: 40 },
    { name: 'buttonHref', type: 'text', label: 'Button address', defaultValue: '/contact', maxLength: 300 },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description:
          'Claims here are read closely during procurement, so only state what you can evidence.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 60 },
        { name: 'description', type: 'textarea', required: true, maxLength: 260 },
        iconField('shield'),
      ],
    },
  ],
}
