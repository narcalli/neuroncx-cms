import type { Tab } from 'payload'
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
 * from the reference.
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
    PreviewField({
      hasGenerateFn: true,
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
    }),
  ],
})
