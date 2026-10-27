import type { Tab } from 'payload'

import { validatePrimaryKeyword } from '../content/paths'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

/**
 * SEO tab (fields_reference.md, section 3: meta.title, meta.description,
 * meta.image), built the same way as on Pages and Posts, with the hard caps
 * from the reference, and meta.primaryKeyword, unique across Pages and every
 * content collection (src/content/paths.ts).
 */
export const seoTab = (): Tab => ({
  name: 'meta',
  label: 'SEO',
  fields: [
    OverviewField({
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
      imagePath: 'meta.image',
    }),
    MetaTitleField({
      hasGenerateFn: true,
      overrides: { maxLength: 60 },
    }),
    MetaImageField({
      relationTo: 'media',
    }),
    MetaDescriptionField({
      overrides: { maxLength: 155 },
    }),
    {
      name: 'primaryKeyword',
      type: 'text',
      label: 'Primary keyword',
      maxLength: 60,
      validate: validatePrimaryKeyword,
      admin: {
        description: 'The one search phrase this page is written for. No page or entry shares a primary keyword with another.',
      },
    },
    PreviewField({
      hasGenerateFn: true,
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
    }),
  ],
})
