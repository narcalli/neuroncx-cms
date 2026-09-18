import type { Block } from 'payload'

export const PlatformLayers: Block = {
  slug: 'platformLayers',
  interfaceName: 'PlatformLayersBlock',
  labels: { singular: 'Platform Layers', plural: 'Platform Layers' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. The platform' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    {
      name: 'intro',
      type: 'text',
      label: 'Intro line',
      admin: { description: 'e.g. Scroll to move through the stack — each layer builds on the one before it.' },
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
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'tag',
          type: 'text',
          label: 'Tag pill',
          admin: { description: 'Optional, e.g. Core or Adjacent.' },
        },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'message',
          options: [
            { label: 'Message — conversational', value: 'message' },
            { label: 'Bolt — workflows, automation', value: 'bolt' },
            { label: 'Layers — context, knowledge', value: 'layers' },
            { label: 'Gauge — quality, analytics', value: 'gauge' },
            { label: 'Plug — integrations', value: 'plug' },
          ],
        },
      ],
    },
  ],
}
