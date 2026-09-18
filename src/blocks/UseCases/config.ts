import type { Block } from 'payload'

export const UseCases: Block = {
  slug: 'useCases',
  interfaceName: 'UseCasesBlock',
  labels: { singular: 'Use Cases', plural: 'Use Cases' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
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
          admin: { description: 'For example Hospitals, Diagnostics, Universities.' },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'What the agent handles',
          admin: { description: 'Name the job, e.g. "Appointment booking and rescheduling".' },
        },
        { name: 'description', type: 'textarea', label: 'Description' },
        {
          name: 'outcome',
          type: 'text',
          label: 'Outcome',
          admin: { description: 'A result, ideally measured. Leave empty rather than inventing one.' },
        },
      ],
    },
  ],
}
