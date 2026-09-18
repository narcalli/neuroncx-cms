import type { Block } from 'payload'

export const ProblemStatement: Block = {
  slug: 'problemStatement',
  interfaceName: 'ProblemStatementBlock',
  labels: { singular: 'Problem Statement', plural: 'Problem Statements' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. The problem' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'problems',
      type: 'array',
      label: 'Problems',
      minRows: 1,
      maxRows: 5,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { description: 'The short name of the problem, e.g. "Siloed systems".' },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: { description: 'One sentence on what it costs them.' },
        },
      ],
    },
    {
      name: 'note',
      type: 'text',
      label: 'Closing note',
      admin: { description: 'Small italic line under the list. Optional.' },
    },
    {
      name: 'systems',
      type: 'array',
      label: 'Systems in the diagram',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'The disconnected systems shown in the panel, e.g. Ops, CRM, Payments.',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'detail', type: 'text', admin: { description: 'e.g. Orders · status' } },
      ],
    },
    {
      name: 'gapLine',
      type: 'text',
      label: 'What is wrong, under the systems',
      admin: { description: 'e.g. records unlinked · context lost between steps' },
    },
    {
      name: 'resolutionLine',
      type: 'text',
      label: 'The resolution line',
      admin: { description: 'e.g. NeuronCx unifies them into' },
    },
    {
      name: 'resolutionHighlight',
      type: 'text',
      label: 'Highlighted phrase at the end',
      admin: { description: 'Shown in green, e.g. one customer context' },
    },
  ],
}
