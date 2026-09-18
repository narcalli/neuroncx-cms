import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Menu',
      maxRows: 7,
      admin: {
        initCollapsed: true,
        description:
          'Each item is either a plain link, or a dropdown if you add columns to it. Only add links to pages that exist — a menu full of dead links is worse than a short menu.',
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Menu label',
        },
        {
          name: 'href',
          type: 'text',
          label: 'Link address',
          admin: {
            description:
              'Where this goes when clicked, e.g. /integrations. Leave empty if it only opens a dropdown.',
          },
        },
        {
          name: 'columns',
          type: 'array',
          label: 'Dropdown columns',
          maxRows: 4,
          admin: {
            initCollapsed: true,
            description:
              'Leave empty for a plain link. Add one to four columns to turn this into a dropdown.',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Column heading',
            },
            {
              name: 'links',
              type: 'array',
              label: 'Links',
              maxRows: 8,
              fields: [
                { name: 'label', type: 'text', required: true },
                {
                  name: 'href',
                  type: 'text',
                  required: true,
                  admin: { description: 'For example /omnichannel-cx' },
                },
                {
                  name: 'description',
                  type: 'text',
                  label: 'One line (optional)',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'signInLabel',
      type: 'text',
      label: 'Sign in link text',
      defaultValue: 'Sign in',
    },
    {
      name: 'signInHref',
      type: 'text',
      label: 'Sign in address',
      defaultValue: 'https://dash.neuroncx.in',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'Button text',
      defaultValue: 'Book a demo',
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'Button address',
      defaultValue: '/contact',
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
