import type { Block } from 'payload'

export const SolutionGrid: Block = {
  slug: 'solutionGrid',
  interfaceName: 'SolutionGridBlock',
  labels: { singular: 'Solution Grid', plural: 'Solution Grids' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label', admin: { description: 'e.g. Solutions' } },
    { name: 'heading', type: 'text', required: true, label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'groups',
      type: 'array',
      label: 'Groups',
      minRows: 1,
      maxRows: 3,
      admin: {
        initCollapsed: true,
        description: 'Each group is a row of cards under its own small heading, e.g. By journey.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, admin: { description: 'e.g. By journey' } },
        {
          name: 'items',
          type: 'array',
          label: 'Cards',
          minRows: 1,
          maxRows: 8,
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'href',
              type: 'text',
              label: 'Link address',
              admin: {
                description:
                  'Optional. Leave empty and the card is plain text rather than a link — better than linking to a page that does not exist yet.',
              },
            },
          ],
        },
      ],
    },
  ],
}
