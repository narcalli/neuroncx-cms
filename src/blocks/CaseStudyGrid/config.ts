import type { Block } from 'payload'

/**
 * A row of customer cards. Pulls the newest customers, filtered by sector, or
 * a hand-picked selection. The block slug stays caseStudyGrid so existing
 * page data is untouched. Uncleared names arrive already anonymised from the
 * CMS (see collections/Customers).
 */
export const CaseStudyGrid: Block = {
  slug: 'caseStudyGrid',
  interfaceName: 'CaseStudyGridBlock',
  labels: { singular: 'Customer grid', plural: 'Customer grids' },
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
        { label: 'Latest customers (optionally by sector)', value: 'collection' },
        { label: 'Hand-picked customers', value: 'selection' },
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
      relationTo: 'customers',
      hasMany: true,
      label: 'Customers',
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
