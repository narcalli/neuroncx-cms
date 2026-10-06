import type { Block } from 'payload'

/**
 * A row of case study cards. Pulls the newest cases, filtered by sector, or a
 * hand-picked selection. Cases marked "client name still to confirm" are never
 * shown on the public site.
 */
export const CaseStudyGrid: Block = {
  slug: 'caseStudyGrid',
  interfaceName: 'CaseStudyGridBlock',
  labels: { singular: 'Case Study Grid', plural: 'Case Study Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 100 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300 },
    {
      name: 'populateBy',
      type: 'select',
      label: 'Show',
      defaultValue: 'collection',
      options: [
        { label: 'Latest case studies (optionally by sector)', value: 'collection' },
        { label: 'Hand-picked case studies', value: 'selection' },
      ],
    },
    {
      name: 'sectors',
      type: 'relationship',
      relationTo: 'sectors',
      hasMany: true,
      label: 'Sectors (optional)',
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'collection',
        description: 'Leave empty to show all sectors.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many',
      defaultValue: 6,
      min: 1,
      max: 6,
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'collection',
      },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      relationTo: 'caseStudies',
      hasMany: true,
      label: 'Case studies',
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'selection',
      },
    },
    {
      name: 'cardStyle',
      type: 'select',
      label: 'Card style',
      defaultValue: 'tilt',
      options: [
        { label: 'Tilt (mouse-tracking)', value: 'tilt' },
        { label: 'Plain', value: 'plain' },
      ],
    },
  ],
}
