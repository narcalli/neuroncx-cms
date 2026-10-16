import type { Tab, UIField } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { requiredForOwnPage } from './validators/ownPage'

/**
 * The SEO check panel for the sidebar (collections/integrations/admin/SeoCheck.tsx):
 * where the primary keyword appears, with live character counts. Read only.
 * "item" checks heroHeading and summary; "master" checks h1.
 */
export const seoCheckField = (mode: 'item' | 'master'): UIField => ({
  name: 'seoCheck',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: {
        path: '@/collections/integrations/admin/SeoCheck#SeoCheck',
        clientProps: { mode },
      },
    },
  },
})

/**
 * The SEO tab: keywords, then the SEO plugin fields under meta (meta.title,
 * meta.description, meta.image), as on Pages. The plugin's generate buttons
 * are off: they are written for Pages and Posts. With `ownPage`, the title
 * and description are needed to publish with Own page on, and their
 * descriptions explain the fallbacks the collection's hook fills in.
 */
export const seoTab = (opts: {
  keywordDescription: string
  ownPage?: { titleDescription: string; descriptionDescription: string }
}): Tab => ({
  label: 'SEO',
  fields: [
    {
      name: 'primaryKeyword',
      type: 'text',
      label: 'Primary keyword',
      maxLength: 60,
      admin: { description: opts.keywordDescription },
    },
    {
      name: 'secondaryKeywords',
      type: 'array',
      label: 'Secondary keywords',
      labels: { singular: 'Keyword', plural: 'Keywords' },
      maxRows: 5,
      admin: { description: 'Up to 5 related phrases.' },
      fields: [{ name: 'keyword', type: 'text', required: true, maxLength: 60 }],
    },
    {
      name: 'meta',
      type: 'group',
      label: 'Search listing',
      fields: [
        OverviewField({
          titlePath: 'meta.title',
          descriptionPath: 'meta.description',
          imagePath: 'meta.image',
        }),
        MetaTitleField({
          hasGenerateFn: false,
          overrides: {
            maxLength: 60,
            ...(opts.ownPage
              ? {
                  validate: requiredForOwnPage('an SEO title'),
                  admin: { description: opts.ownPage.titleDescription },
                }
              : {}),
          },
        }),
        MetaImageField({ relationTo: 'media' }),
        MetaDescriptionField({
          hasGenerateFn: false,
          overrides: {
            maxLength: 155,
            ...(opts.ownPage
              ? {
                  validate: requiredForOwnPage('an SEO description'),
                  admin: { description: opts.ownPage.descriptionDescription },
                }
              : {}),
          },
        }),
        PreviewField({
          hasGenerateFn: false,
          titlePath: 'meta.title',
          descriptionPath: 'meta.description',
        }),
      ],
    },
  ],
})
