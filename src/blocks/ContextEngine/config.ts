import type { Block } from 'payload'

export const ContextEngine: Block = {
  slug: 'contextEngine',
  interfaceName: 'ContextEngineBlock',
  labels: { singular: 'Context Engine', plural: 'Context Engines' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. Why NeuronCx' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro paragraph' },
    {
      name: 'points',
      type: 'array',
      label: 'Points',
      maxRows: 5,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', required: true, admin: { description: 'e.g. Grounded, not scripted.' } },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'calloutTerm',
      type: 'text',
      label: 'Callout — the term',
      admin: { description: 'e.g. Customer 360' },
    },
    {
      name: 'calloutText',
      type: 'text',
      label: 'Callout — what it means',
      admin: { description: 'e.g. is the shared memory every agent and channel reads from.' },
    },
    {
      name: 'centreLabel',
      type: 'text',
      label: 'Centre of the diagram',
      defaultValue: 'Context Engine',
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
      fields: [{ name: 'label', type: 'text', required: true }],
    },
  ],
}
