import type { GlobalConfig } from 'payload'
import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'tagline',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'One or two sentences under the logo describing what NeuronCx does.',
      },
    },
    {
      name: 'columns',
      type: 'array',
      maxRows: 3,
      admin: {
        initCollapsed: true,
        description: 'Groups of links on the right side of the footer, e.g. Platform and Company.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Heading for this group of links.',
          },
        },
        {
          name: 'navItems',
          type: 'array',
          maxRows: 8,
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },
    {
      name: 'email',
      type: 'text',
      admin: {
        description: 'Contact email shown in the footer.',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Contact phone number shown in the footer.',
      },
    },
    {
      name: 'legalItems',
      type: 'array',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Small links on the bottom line, e.g. Terms and Privacy.',
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
