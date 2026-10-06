import type { Block } from 'payload'

/**
 * A directory of customers, one row per case study, filtered by sector on the
 * page. Rows come from the case studies collection. Nothing is entered per row.
 */
export const CustomerDirectory: Block = {
  slug: 'customerDirectory',
  interfaceName: 'CustomerDirectoryBlock',
  labels: { singular: 'Customer Directory', plural: 'Customer Directories' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 100 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300 },
    {
      name: 'sectors',
      type: 'relationship',
      relationTo: 'sectors',
      hasMany: true,
      label: 'Sectors to include (optional)',
      admin: { description: 'Leave empty to show every sector.' },
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      label: 'Show sector filters',
      defaultValue: true,
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      defaultValue: 'list',
      options: [
        { label: 'List', value: 'list' },
        { label: 'Grid', value: 'grid' },
      ],
    },
    {
      name: 'emptyStateText',
      type: 'text',
      label: 'Text when nothing matches',
      defaultValue: 'More stories coming soon.',
      maxLength: 120,
    },
  ],
}
