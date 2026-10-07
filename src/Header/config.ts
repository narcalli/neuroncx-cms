import type { GlobalConfig } from 'payload'

import { revalidateHeader } from './hooks/revalidateHeader'

// Old-style dropdown columns stay visible only while a row still has them, so
// existing menus keep working but nobody builds a new one the old way.
const hasLegacyColumns = (_: unknown, siblingData: { columns?: unknown[] } | undefined) =>
  Boolean(siblingData?.columns?.length)

const isDropdown = (_: unknown, siblingData: { type?: string } | undefined) =>
  siblingData?.type === 'dropdown'

const announcementOn = (_: unknown, siblingData: { enabled?: boolean } | undefined) =>
  Boolean(siblingData?.enabled)

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: {
        description: 'Shown in the header. Leave empty to use the default NeuronCx logo.',
      },
    },
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement bar',
      admin: {
        description:
          'A thin strip above the header. A visitor who dismisses it will not see it again until they open a new browser session.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Show the announcement bar',
          defaultValue: false,
        },
        {
          name: 'text',
          type: 'text',
          label: 'Message',
          admin: { condition: announcementOn },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Link text (optional)',
          admin: { condition: announcementOn },
        },
        {
          name: 'ctaHref',
          type: 'text',
          label: 'Link address (optional)',
          admin: { condition: announcementOn },
        },
      ],
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Menu',
      maxRows: 7,
      admin: {
        initCollapsed: true,
        description:
          'Each item is either a plain link or a dropdown. Only add links to pages that exist. A menu full of dead links is worse than a short menu.',
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
          name: 'type',
          type: 'radio',
          label: 'What this item does',
          defaultValue: 'link',
          options: [
            { label: 'Goes straight to a page', value: 'link' },
            { label: 'Opens a dropdown', value: 'dropdown' },
          ],
          admin: { layout: 'horizontal' },
        },
        {
          name: 'href',
          type: 'text',
          label: 'Link address',
          admin: {
            description: 'Where this goes when clicked, e.g. /integrations.',
            condition: (_, siblingData) => siblingData?.type !== 'dropdown',
          },
        },
        {
          name: 'items',
          type: 'array',
          label: 'Dropdown links',
          maxRows: 12,
          admin: {
            initCollapsed: true,
            condition: isDropdown,
            description:
              'One flat list, top to bottom. Use a group heading to start a new section part-way down.',
          },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, label: 'Link address' },
            {
              name: 'badge',
              type: 'text',
              label: 'Badge (optional)',
              admin: { description: 'A short word such as NEW or API. Leave empty for no badge.' },
            },
            {
              name: 'groupHeading',
              type: 'text',
              label: 'Group heading (optional)',
              admin: {
                description:
                  'Starts a new group above this link. Leave empty to continue the group above.',
              },
            },
            { name: 'newTab', type: 'checkbox', label: 'Open in a new tab', defaultValue: false },
          ],
        },
        {
          name: 'columns',
          type: 'array',
          label: 'Dropdown columns (old style)',
          maxRows: 4,
          admin: {
            initCollapsed: true,
            condition: hasLegacyColumns,
            description:
              'Kept so the old menu still works. Move these links up into the dropdown links above, then clear this and it will disappear.',
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
      name: 'supportLabel',
      type: 'text',
      label: 'Support link text',
      defaultValue: 'Support',
      admin: {
        description: 'Sits to the left of the sign in link. Leave either field empty to hide it.',
      },
    },
    {
      name: 'supportHref',
      type: 'text',
      label: 'Support address',
      admin: { description: 'For example /contact, or a help centre address.' },
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
