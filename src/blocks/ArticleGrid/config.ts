import type { Block } from 'payload'

export const ArticleGrid: Block = {
  slug: 'articleGrid',
  interfaceName: 'ArticleGridBlock',
  labels: {
    singular: 'Article grid',
    plural: 'Article grids',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'From the team',
      admin: {
        description: 'Heading above the articles.',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'Optional line under the heading.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      admin: {
        description: 'How many articles to show. The most recently published appear first.',
      },
    },
  ],
}
