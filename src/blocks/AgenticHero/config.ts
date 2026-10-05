import type { Block } from 'payload'

/**
 * Full-width navy hero with a word-by-word headline reveal, an animated
 * network diagram of agents and people, and drifting background blobs.
 * Built for agentic CRM / workflow pages.
 */
export const AgenticHero: Block = {
  slug: 'agenticHero',
  interfaceName: 'AgenticHeroBlock',
  labels: { singular: 'Agentic Hero', plural: 'Agentic Heroes' },
  fields: [
    {
      name: 'headline',
      type: 'text',
      label: 'Headline',
      required: true,
      maxLength: 120,
      admin: { description: 'Shown large across the top of the hero.' },
    },
    {
      name: 'accentWords',
      type: 'text',
      label: 'Words to highlight',
      maxLength: 120,
      admin: {
        description:
          'Comma-separated words from the headline to underline in the accent colour, e.g. "agentic, workflows".',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro',
      maxLength: 300,
    },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Button text', admin: { width: '50%' } },
        { name: 'ctaUrl', type: 'text', label: 'Button address', admin: { width: '50%' } },
      ],
    },
    {
      name: 'nodes',
      type: 'array',
      label: 'Network nodes',
      minRows: 0,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Up to six nodes around the diagram. Leave empty to hide the diagram.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Label', required: true, maxLength: 30 },
        {
          name: 'kind',
          type: 'select',
          label: 'Kind',
          defaultValue: 'agent',
          options: [
            { label: 'Virtual agent', value: 'agent' },
            { label: 'Human team', value: 'human' },
            { label: 'Connected system', value: 'system' },
          ],
        },
      ],
    },
  ],
}
