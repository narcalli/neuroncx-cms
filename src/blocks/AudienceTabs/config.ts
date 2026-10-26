import type { Block, TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

/**
 * A link address: a page on this site ("/pricing"), a section on this page
 * ("#how-it-works") or a secure outside address ("https://..."). A custom
 * validate replaces Payload's own, so the standard text check runs first.
 */
export const validateLinkUrl: TextFieldSingleValidation = (value, options) => {
  const base = text(value, options)
  if (base !== true) return base
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return 'Add a link address.'
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('https://')) return true
  return 'Start the address with "/" for a page on this site, "#" for a section on this page, or "https://" for another site.'
}

/**
 * Audience tabs: one section that gives each reader group (leadership,
 * operations, IT) its own short summary and links. A row of tabs; each tab
 * opens a panel with a title, an intro, links and capability points. Every
 * panel is in the page's HTML, so search engines read all of them.
 */
export const AudienceTabs: Block = {
  slug: 'audienceTabs',
  interfaceName: 'AudienceTabsBlock',
  labels: { singular: 'Audience tabs', plural: 'Audience tabs' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60, admin: { description: 'Optional. The small line above the heading.' } },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300, admin: { description: 'Optional. One or two sentences under the heading.' } },
    {
      name: 'tabs',
      type: 'array',
      label: 'Tabs',
      labels: { singular: 'Tab', plural: 'Tabs' },
      required: true,
      minRows: 2,
      maxRows: 4,
      admin: {
        description: 'One tab per reader group, left to right. The first tab is shown when the page opens.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Tab name',
          required: true,
          maxLength: 30,
          admin: { description: 'The reader group, for example Leadership, Operations or IT.' },
        },
        { name: 'title', type: 'text', label: 'Title', maxLength: 70, admin: { description: 'Optional. The heading inside the panel.' } },
        { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 240, admin: { description: 'Optional. A short summary for this group.' } },
        {
          name: 'points',
          type: 'array',
          label: 'Points',
          labels: { singular: 'Point', plural: 'Points' },
          required: true,
          minRows: 2,
          maxRows: 5,
          admin: {
            description: 'One capability per line, stated as what the platform does. No stories or invented figures.',
          },
          fields: [{ name: 'text', type: 'text', label: 'Point', required: true, maxLength: 160 }],
        },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          labels: { singular: 'Link', plural: 'Links' },
          maxRows: 3,
          admin: { description: 'Optional. Shown under the intro.' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Link text', required: true, maxLength: 40, admin: { width: '40%' } },
                {
                  name: 'url',
                  type: 'text',
                  label: 'Link address (/page, #section or https://)',
                  required: true,
                  validate: validateLinkUrl,
                  admin: { width: '60%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
