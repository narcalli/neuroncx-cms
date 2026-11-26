import type { Block } from 'payload'

export const UseCases: Block = {
  slug: 'useCases',
  interfaceName: 'UseCasesBlock',
  labels: { singular: 'Use Cases', plural: 'Use Cases' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading', maxLength: 40 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro line', maxLength: 300 },
    {
      name: 'cases',
      type: 'array',
      label: 'Use cases',
      minRows: 1,
      maxRows: 8,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'sector',
          type: 'text',
          label: 'Sector',
          maxLength: 30,
          admin: { description: 'For example Hospitals, Diagnostics, Universities.' },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'What the agent handles',
          maxLength: 80,
          admin: { description: 'Name the job, e.g. "Appointment booking and rescheduling".' },
        },
        { name: 'description', type: 'textarea', label: 'Description', maxLength: 160 },
        {
          name: 'outcome',
          type: 'text',
          label: 'Outcome',
          maxLength: 80,
          admin: { description: 'A result, ideally measured. Leave empty rather than inventing one.' },
        },
      ],
    },
  ],
}
