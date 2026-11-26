import type { Block } from 'payload'
import { iconField } from '@/fields/icons'

export const PlatformLayers: Block = {
  slug: 'platformLayers',
  interfaceName: 'PlatformLayersBlock',
  labels: { singular: 'Platform Layers (Sticky Stage)', plural: 'Platform Layers (Sticky Stage)' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', maxLength: 60, admin: { description: 'e.g. The platform' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading', maxLength: 140 },
    {
      name: 'intro',
      type: 'text',
      label: 'Intro line',
      maxLength: 200,
      admin: { description: 'e.g. Scroll to move through the stack. Each layer builds on the one before it.' },
    },
    {
      name: 'layers',
      type: 'array',
      label: 'Layers',
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Each one takes a screen as the visitor scrolls, so keep the list short.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 60 },
        { name: 'description', type: 'textarea', required: true, maxLength: 200 },
        {
          name: 'tag',
          type: 'text',
          label: 'Tag pill',
          maxLength: 40,
          admin: { description: 'Optional, e.g. Core or Adjacent.' },
        },
        iconField('message'),
      ],
    },
  ],
}
