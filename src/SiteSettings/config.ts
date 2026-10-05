import type { GlobalConfig } from 'payload'

/**
 * Site-wide settings: browser icons, the default page title and description,
 * the default share image, and the web app manifest. Every upload is optional.
 * Leave a field empty and the website uses its built-in default for it.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  fields: [
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
