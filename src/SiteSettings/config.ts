import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'

import { validateWhatsappPhone } from '../blocks/WhatsappWidget/config'
import { revalidateContent } from '../content/revalidate'
import { siteAnimationsField } from '../fields/motion'

/** A new Animations setting reaches every page: the website refreshes all of them. */
const refreshEveryPage: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate || doc?.animations === previousDoc?.animations) return doc
  await revalidateContent({
    collection: 'siteSettings',
    paths: ['/'],
    reason: `animations ${previousDoc?.animations ?? 'on'} to ${doc?.animations}`,
    logger: req.payload?.logger,
  })
  return doc
}

/**
 * Site-wide settings: browser icons, the default page title and description,
 * the default share image, the web app manifest and the WhatsApp button. Every
 * upload is optional.
 * Leave a field empty and the website uses its built-in default for it.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  hooks: { afterChange: [refreshEveryPage] },
  fields: [
    {
      type: 'collapsible',
      label: 'Animations',
      admin: { initCollapsed: false },
      fields: [siteAnimationsField],
    },
    {
      name: 'whatsappButton',
      type: 'group',
      label: 'WhatsApp button',
      admin: {
        description:
          'One button on every page. While it is on, any WhatsApp widget block placed on a page shows nothing.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Show the button',
          defaultValue: false,
        },
        {
          name: 'phone',
          type: 'text',
          label: 'WhatsApp number (E.164)',
          admin: {
            description:
              'For example +919876543210. Used to build the chat link; the number itself is not shown on the page.',
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
          validate: validateWhatsappPhone,
        },
        {
          name: 'message',
          type: 'textarea',
          label: 'Prefilled message',
          admin: {
            description: 'What the visitor sends. The page reference is appended to it.',
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Button text (up to 20 characters)',
          maxLength: 20,
          defaultValue: 'Chat',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
        {
          name: 'hideOnPages',
          type: 'relationship',
          relationTo: 'pages',
          hasMany: true,
          // Ids only: this global is read on every request, and the website looks up just the addresses.
          maxDepth: 0,
          label: 'Hide on these pages (optional)',
          admin: {
            description: 'CMS pages only. Pages from other collections always show the button.',
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Browser icons',
      admin: { initCollapsed: false, description: 'Leave any icon empty to use the default.' },
      fields: [
        {
          name: 'faviconSvg',
          type: 'upload',
          relationTo: 'media',
          label: 'Favicon (SVG)',
          admin: {
            description: 'Main tab icon for modern browsers. Use a simple SVG with a square viewBox.',
          },
        },
        {
          name: 'faviconIco',
          type: 'upload',
          relationTo: 'media',
          label: 'Favicon (ICO)',
          admin: {
            description: 'For older browsers and Windows shortcuts. 32×32 or 48×48.',
          },
        },
        {
          name: 'favicon32',
          type: 'upload',
          relationTo: 'media',
          label: 'Favicon (PNG 32×32)',
          admin: { description: 'PNG alternative for browsers that support it.' },
        },
        {
          name: 'appleTouchIcon',
          type: 'upload',
          relationTo: 'media',
          label: 'Apple touch icon (PNG 180×180)',
          admin: { description: 'Used when someone adds the site to an iPhone or iPad home screen.' },
        },
        {
          name: 'androidIcon',
          type: 'upload',
          relationTo: 'media',
          label: 'Android icon (PNG 192×192)',
          admin: { description: 'Used by the web app manifest on Android home screens.' },
        },
        {
          name: 'largeIcon',
          type: 'upload',
          relationTo: 'media',
          label: 'Large icon (PNG 512×512)',
          admin: { description: 'High-resolution icon for the web app manifest and splash screens.' },
        },
        {
          name: 'maskableIcon',
          type: 'upload',
          relationTo: 'media',
          label: 'Maskable icon (PNG 512×512)',
          admin: {
            description:
              'Keep the logo inside the centre 80%. Android crops this icon to different shapes, so the edges can be cut off.',
          },
        },
        {
          name: 'themeColor',
          type: 'text',
          label: 'Theme colour',
          maxLength: 9,
          admin: {
            description: 'Hex colour, e.g. #1A2035. Sets the browser toolbar colour on phones.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Site identity',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: 'Site name',
          maxLength: 60,
          admin: { description: 'For example NeuronCx. Used in the web app manifest.' },
        },
        {
          name: 'defaultTitle',
          type: 'text',
          label: 'Default page title',
          maxLength: 70,
          admin: {
            description: 'Used when a page has no SEO title of its own. Replaces the "Blog" title.',
          },
        },
        {
          name: 'titleSuffix',
          type: 'text',
          label: 'Title suffix',
          maxLength: 40,
          admin: {
            description: 'Added to the end of every page title, e.g. " | NeuronCx".',
          },
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          label: 'Default description',
          maxLength: 160,
          admin: {
            description: 'Used when a page has no meta description of its own. Keep it under 160 characters.',
          },
        },
        {
          name: 'defaultShareImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default share image',
          admin: {
            description: 'Shown when a link is shared on LinkedIn, WhatsApp and similar. 1200×630 works best.',
          },
        },
        {
          name: 'twitterCardType',
          type: 'select',
          label: 'Social card type',
          defaultValue: 'summary_large_image',
          options: [
            { label: 'Large image', value: 'summary_large_image' },
            { label: 'Small image', value: 'summary' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Web app (home screen)',
      admin: { initCollapsed: true, description: 'Used when someone adds the site to their home screen.' },
      fields: [
        {
          name: 'manifestShortName',
          type: 'text',
          label: 'Short name',
          maxLength: 12,
          admin: { description: 'Up to 12 characters, shown under the home screen icon.' },
        },
        {
          name: 'manifestDisplay',
          type: 'select',
          label: 'Display mode',
          defaultValue: 'browser',
          options: [
            { label: 'Browser (normal tab)', value: 'browser' },
            { label: 'Standalone (opens like an app)', value: 'standalone' },
          ],
        },
        {
          name: 'manifestBackground',
          type: 'text',
          label: 'Splash background colour',
          maxLength: 9,
          admin: { description: 'Hex colour, e.g. #FFFFFF.' },
        },
      ],
    },
  ],
}
