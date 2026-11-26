import type { Block } from 'payload'

export const ContextEngine: Block = {
  slug: 'contextEngine',
  interfaceName: 'ContextEngineBlock',
  labels: { singular: 'Context Engine', plural: 'Context Engines' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', maxLength: 60, admin: { description: 'e.g. Why NeuronCx' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading', maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro paragraph', maxLength: 300 },
    {
      name: 'points',
      type: 'array',
      label: 'Points',
      maxRows: 5,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 60, admin: { description: 'e.g. Grounded, not scripted.' } },
        { name: 'description', type: 'textarea', required: true, maxLength: 140 },
      ],
    },
    {
      name: 'calloutTerm',
      type: 'text',
      label: 'Callout term',
      maxLength: 40,
      admin: { description: 'e.g. Customer 360' },
    },
    {
      name: 'calloutText',
      type: 'text',
      label: 'Callout definition',
      maxLength: 160,
      admin: { description: 'e.g. is the shared memory every agent and channel reads from.' },
    },
    {
      name: 'centreLabel',
      type: 'text',
      label: 'Centre of the diagram',
      defaultValue: 'Context Engine',
      maxLength: 40,
    },
    {
      name: 'satellites',
      type: 'array',
      label: 'Nodes around the centre',
      minRows: 3,
      maxRows: 9,
      admin: {
        initCollapsed: true,
        description:
          'Spaced evenly around the centre automatically. Six to eight looks best; more than that and the labels crowd.',
      },
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 20 }],
    },
  ],
}
