import type { Block } from 'payload'

export const JourneyEngine: Block = {
  slug: 'journeyEngine',
  interfaceName: 'JourneyEngineBlock',
  labels: { singular: 'Journey Engine', plural: 'Journey Engines' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. A live journey' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'stages',
      type: 'array',
      label: 'Stages',
      minRows: 2,
      maxRows: 8,
      admin: {
        initCollapsed: true,
        description:
          'The stages of the journey, defined once. Every industry below uses these same stages in this same order.',
      },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Enquiry' } },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'message',
          options: [
            { label: 'Message — enquiry', value: 'message' },
            { label: 'Check — qualify', value: 'check' },
            { label: 'Calendar — book, order', value: 'calendar' },
            { label: 'Card — pay', value: 'card' },
            { label: 'Document — fulfil', value: 'document' },
            { label: 'Chat — follow-up', value: 'chat' },
            { label: 'Refresh — recover', value: 'refresh' },
          ],
        },
      ],
    },
    {
      name: 'industries',
      type: 'array',
      label: 'Industries',
      minRows: 1,
      maxRows: 5,
      admin: {
        initCollapsed: true,
        description:
          'One tab per industry. Add one detail per stage, in the same order as the stages above — the first detail belongs to the first stage.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Tab label, e.g. Diagnostics' } },
        {
          name: 'details',
          type: 'array',
          label: 'What happens at each stage',
          maxRows: 8,
          fields: [
            { name: 'title', type: 'text', required: true, admin: { description: 'e.g. Recovery' } },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
      ],
    },
  ],
}
