import type { Block } from 'payload'

export const ClosingCTA: Block = {
  slug: 'closingCta',
  interfaceName: 'ClosingCTABlock',
  labels: { singular: 'Closing call to action', plural: 'Closing calls to action' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Heading',
      admin: { description: 'The last thing a visitor reads. Make it a clear ask.' },
    },
    { name: 'subhead', type: 'textarea', label: 'Subhead' },
    { name: 'primaryLabel', type: 'text', label: 'Primary button text' },
    { name: 'primaryLink', type: 'text', label: 'Primary button address', defaultValue: '/contact' },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button text' },
    { name: 'secondaryLink', type: 'text', label: 'Secondary button address' },
    {
      name: 'tagline',
      type: 'text',
      label: 'Tagline under the buttons',
      admin: { description: 'Optional, shown in italics. Short — a line, not a sentence.' },
    },
  ],
}
