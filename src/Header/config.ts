import type { GlobalConfig } from 'payload'

import { iconField } from '../fields/icons'
import { link } from '../fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

const isLink = (_: unknown, siblingData: { type?: string } | undefined) => siblingData?.type !== 'megaMenu'

const isMegaMenu = (_: unknown, siblingData: { type?: string } | undefined) => siblingData?.type === 'megaMenu'

const featuredOn = (_: unknown, siblingData: { enabled?: boolean } | undefined) => Boolean(siblingData?.enabled)

/** How a mega menu lays itself out, for editors (the website follows the same rules). */
export const MEGA_MENU_LAYOUT =
  'The menu panel sizes itself. A single group hides its label. Groups with 4 or more items wrap into 2 columns. The featured card only shows when the menu has 5 or more items in total.'

/**
 * The icons a mega menu item may use: 30 of the shared library
 * (src/fields/icons.ts), the ones that name a product, a job or a sector.
 */
export const MENU_ICONS = [
  'message',
  'chat',
  'bot',
  'sparkles',
  'workflow',
  'bolt',
  'layers',
  'database',
  'users',
  'chart',
  'gauge',
  'target',
  'plug',
  'link',
  'puzzle',
  'globe',
  'shield',
  'shieldCheck',
  'lock',
  'settings',
  'fileText',
  'clipboardList',
  'graduationCap',
  'hospital',
  'stethoscope',
  'building',
  'briefcase',
  'rocket',
  'search',
  'headphones',
] as const

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
          'Each item is either a plain link or a mega menu. Only add links to pages that exist. A menu full of dead links is worse than a short menu.',
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          maxLength: 30,
          label: 'Menu label',
        },
        {
          name: 'type',
          type: 'select',
          label: 'What this item does',
          required: true,
          defaultValue: 'link',
          options: [
            { label: 'Link (goes straight to a page)', value: 'link' },
            { label: 'Mega menu (opens a panel of links)', value: 'megaMenu' },
          ],
        },
        link({ appearances: false, disableLabel: true, overrides: { admin: { condition: isLink } } }),
        {
          name: 'groups',
          type: 'array',
          label: 'Groups',
          labels: { singular: 'Group', plural: 'Groups' },
          admin: {
            initCollapsed: true,
            condition: isMegaMenu,
            description: MEGA_MENU_LAYOUT,
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Group label (optional)',
              maxLength: 24,
              admin: { description: 'Such as Modules or Agents. Hidden when the menu has a single group.' },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Items',
              labels: { singular: 'Item', plural: 'Items' },
              minRows: 1,
              admin: { initCollapsed: true },
              fields: [
                iconField(undefined, { only: MENU_ICONS }),
                { name: 'label', type: 'text', required: true, maxLength: 30 },
                {
                  name: 'description',
                  type: 'text',
                  label: 'Description (optional)',
                  maxLength: 50,
                  admin: { description: 'One short line naming what this does' },
                },
                link({ appearances: false, disableLabel: true }),
                {
                  name: 'badge',
                  type: 'select',
                  label: 'Badge',
                  defaultValue: 'none',
                  options: [
                    { label: 'None', value: 'none' },
                    { label: 'New', value: 'new' },
                    { label: 'Beta', value: 'beta' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'featured',
          type: 'group',
          label: 'Featured card',
          admin: {
            condition: isMegaMenu,
            description: 'A card in the last column of the panel. It only shows when the menu has 5 or more items in total.',
          },
          fields: [
            { name: 'enabled', type: 'checkbox', label: 'Show the featured card', defaultValue: false },
            { name: 'eyebrow', type: 'text', maxLength: 20, admin: { condition: featuredOn } },
            { name: 'title', type: 'text', maxLength: 50, admin: { condition: featuredOn } },
            {
              name: 'image',
              type: 'upload',
              label: 'Image (optional)',
              relationTo: 'media',
              admin: { condition: featuredOn },
            },
            link({ appearances: false, disableLabel: true, overrides: { admin: { condition: featuredOn } } }),
            { name: 'linkLabel', type: 'text', label: 'Link text', maxLength: 24, admin: { condition: featuredOn } },
          ],
        },
        // The fields below held the menu before the mega menu. They are kept,
        // hidden, so no saved menu loses anything: the website still reads
        // them for a menu that has not been copied into the fields above
        // (scripts/migrate-mega-menu.ts).
        {
          name: 'href',
          type: 'text',
          label: 'Link address (old)',
          admin: { hidden: true },
        },
        {
          name: 'items',
          type: 'array',
          label: 'Dropdown links (old)',
          maxRows: 12,
          admin: { hidden: true },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, label: 'Link address' },
            { name: 'badge', type: 'text', label: 'Badge (optional)' },
            { name: 'groupHeading', type: 'text', label: 'Group heading (optional)' },
            { name: 'newTab', type: 'checkbox', label: 'Open in a new tab', defaultValue: false },
          ],
        },
        {
          name: 'columns',
          type: 'array',
          label: 'Dropdown columns (old)',
          maxRows: 4,
          admin: { hidden: true },
          fields: [
            { name: 'heading', type: 'text', label: 'Column heading' },
            {
              name: 'links',
              type: 'array',
              label: 'Links',
              maxRows: 8,
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'href', type: 'text', required: true },
                { name: 'description', type: 'text', label: 'One line (optional)' },
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
