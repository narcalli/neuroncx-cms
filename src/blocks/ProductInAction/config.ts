import type { Block } from 'payload'

import { iconField } from '@/fields/icons'

/**
 * A section of large product cards: text on one side, a screenshot on the
 * other. On large screens the cards stack as the reader scrolls (CSS only),
 * and below that they are a plain vertical list.
 */
export const ProductInAction: Block = {
  slug: 'productInAction',
  interfaceName: 'ProductInActionBlock',
  labels: { singular: 'Product in Action', plural: 'Product in Action' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 500 },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      defaultValue: 'stacked',
      options: [
        { label: 'Stacked (cards pile up on scroll)', value: 'stacked' },
        { label: 'Plain (normal vertical list)', value: 'plain' },
      ],
      admin: {
        description: 'Stacked makes the cards pile up on scroll. Plain is a normal vertical list.',
      },
    },
    {
      name: 'alternateSides',
      type: 'checkbox',
      label: 'Alternate sides',
      defaultValue: false,
      admin: { description: 'Flips the image to the other side on every second card' },
    },
    {
      name: 'theme',
      type: 'select',
      label: 'Theme',
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Tinted', value: 'tinted' },
      ],
    },
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor ID',
      admin: { description: 'Optional. Lets a link such as #product-in-action jump to this block.' },
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      required: true,
      minRows: 2,
      maxRows: 5,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/ProductInAction/RowLabel#ProductInActionRowLabel',
        },
      },
      fields: [
        iconField(undefined, { name: 'icon', label: 'Icon' }),
        { name: 'title', type: 'text', label: 'Title', required: true, maxLength: 90 },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: true,
          maxLength: 300,
          admin: { description: 'One or two sentences' },
        },
        {
          name: 'bullets',
          type: 'array',
          label: 'Benefit bullets',
          maxRows: 4,
          admin: { initCollapsed: true },
          fields: [{ name: 'text', type: 'text', required: true, maxLength: 120 }],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Screenshot',
          required: true,
          admin: {
            description:
              'Use screenshots from the demo tenant only. No real patient names, phone numbers, call recordings or client branding. This page is public.',
          },
        },
        {
          name: 'imageAlt',
          type: 'text',
          label: 'Screenshot description (alt text)',
          required: true,
          maxLength: 200,
          admin: {
            description:
              'Describe what the screen shows. This is read by search engines and screen readers.',
          },
        },
        {
          name: 'imageCaption',
          type: 'text',
          label: 'Caption under the screenshot',
          maxLength: 160,
        },
        {
          name: 'link',
          type: 'group',
          label: 'Link (optional)',
          admin: {
            hideGutter: true,
            description: 'Optional. Leave the address empty to show the card with no link.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Link text', admin: { width: '50%' } },
                { name: 'url', type: 'text', label: 'Link address', admin: { width: '50%' } },
              ],
            },
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
              defaultValue: false,
            },
          ],
        },
      ],
    },
  ],
}
