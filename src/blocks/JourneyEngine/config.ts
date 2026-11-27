import type { Block } from 'payload'
import { iconField } from '@/fields/icons'

export const JourneyEngine: Block = {
  slug: 'journeyEngine',
  interfaceName: 'JourneyEngineBlock',
  labels: { singular: 'Journey Engine', plural: 'Journey Engines' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', maxLength: 60, admin: { description: 'e.g. A live journey' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading', maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro line', maxLength: 300 },
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
        { name: 'label', type: 'text', required: true, maxLength: 24, admin: { description: 'e.g. Enquiry' } },
        iconField('message'),
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
          'One tab per industry. Add one detail per stage, in the same order as the stages above: the first detail belongs to the first stage.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, maxLength: 30, admin: { description: 'Tab label, e.g. Diagnostics' } },
        {
          name: 'details',
          type: 'array',
          label: 'What happens at each stage',
          maxRows: 8,
          fields: [
            { name: 'title', type: 'text', required: true, maxLength: 60, admin: { description: 'e.g. Recovery' } },
            { name: 'description', type: 'textarea', required: true, maxLength: 200 },
          ],
        },
      ],
    },
  ],
}
