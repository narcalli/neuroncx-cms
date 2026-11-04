import type { CheckboxField, Tab } from 'payload'

import { validatePrimaryKeyword } from '../content/paths'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

/**
 * "Hide from search engines" (meta.noIndex), in every SEO tab: the website
 * marks the page noindex, follow and leaves it out of its sitemaps. The page
 * stays reachable by its address.
 */
export const noIndexField = (): CheckboxField => ({
  name: 'noIndex',
  type: 'checkbox',
  label: 'Hide from search engines (noindex)',
  defaultValue: false,
  admin: {
    description:
      'The page stays on the site for anyone with the link, but search engines are asked to leave it out and it is not listed in the sitemap.',
  },
})

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
    noIndexField(),
    PreviewField({
      hasGenerateFn: true,
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
    }),
  ],
})
