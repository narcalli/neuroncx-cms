import type { Block } from 'payload'

/**
 * "One transaction, many users": a list of related roles on the left and an
 * orbit diagram on the right where each role circles a central transaction.
 */
export const AgenticOrbit: Block = {
  slug: 'agenticOrbit',
  interfaceName: 'AgenticOrbitBlock',
  labels: { singular: 'Transaction Orbit', plural: 'Transaction Orbits' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 800 },
    { name: 'centreLabel', type: 'text', label: 'Centre label', defaultValue: 'One transaction', maxLength: 30 },
    {
      name: 'roles',
      type: 'array',
      label: 'Roles',
      minRows: 2,
      maxRows: 4,
      admin: { initCollapsed: true, description: 'Each role orbits the centre. Hover or tap one to read its caption.' },
      fields: [
        { name: 'label', type: 'text', label: 'Role', required: true, maxLength: 30 },
        { name: 'subLabel', type: 'text', label: 'Sub-label (optional)', maxLength: 80 },
        { name: 'caption', type: 'text', label: 'Caption shown on hover', required: true, maxLength: 120 },
      ],
    },
  ],
}
