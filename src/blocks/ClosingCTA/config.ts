import type { Block } from 'payload'

import { motionFields } from '../../fields/motion'

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
      maxLength: 140,
      admin: { description: 'The last thing a visitor reads. Make it a clear ask.' },
    },
    { name: 'subhead', type: 'textarea', label: 'Subhead', maxLength: 300 },
    { name: 'primaryLabel', type: 'text', label: 'Primary button text', maxLength: 40 },
    { name: 'primaryLink', type: 'text', label: 'Primary button address', defaultValue: '/contact', maxLength: 300 },
    { name: 'secondaryLabel', type: 'text', label: 'Secondary button text', maxLength: 40 },
    { name: 'secondaryLink', type: 'text', label: 'Secondary button address', maxLength: 300 },
    {
      name: 'tagline',
      type: 'text',
      label: 'Tagline under the buttons',
      maxLength: 80,
      admin: { description: 'Optional, shown in italics. Keep it to a line, not a sentence.' },
    },
    motionFields(),
  ],
}
