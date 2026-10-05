import type { Block } from 'payload'

/**
 * "Where it is running today": a row of case cards with a mouse-tracking
 * tilt and glow. Each can be marked as a client name still to confirm.
 */
export const AgenticCases: Block = {
  slug: 'agenticCases',
  interfaceName: 'AgenticCasesBlock',
  labels: { singular: 'Case Cards', plural: 'Case Cards' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    {
      name: 'hoverGlow',
      type: 'checkbox',
      label: 'Hover glow (gradient border and cursor spotlight)',
      defaultValue: true,
    },
    {
      name: 'cases',
      type: 'array',
      label: 'Cases',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', label: 'Title', required: true, maxLength: 80 },
        { name: 'text', type: 'textarea', label: 'Description', required: true, maxLength: 260 },
        { name: 'linkLabel', type: 'text', label: 'Link text (optional)', maxLength: 60 },
        { name: 'linkUrl', type: 'text', label: 'Link address (optional)', maxLength: 300 },
        {
          name: 'clientPending',
          type: 'checkbox',
          label: 'Client name still to confirm',
          defaultValue: false,
        },
      ],
    },
  ],
}
