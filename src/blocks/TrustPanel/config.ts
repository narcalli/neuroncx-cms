import type { Block } from 'payload'
import { iconField } from '@/fields/icons'

export const TrustPanel: Block = {
  slug: 'trustPanel',
  interfaceName: 'TrustPanelBlock',
  labels: { singular: 'Trust Panel', plural: 'Trust Panels' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. Deployment & trust' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro paragraph' },
    { name: 'buttonLabel', type: 'text', label: 'Button text' },
    { name: 'buttonHref', type: 'text', label: 'Button address', defaultValue: '/contact' },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description:
          'Claims here are read closely during procurement — only state what you can evidence.',
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        iconField('shield'),
      ],
    },
  ],
}
