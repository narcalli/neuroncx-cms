import type { Tab } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

/**
 * Detail group (fields_reference.md, section 3, without the SEO fields,
 * which are in seo.ts). The description editor matches the Content block's,
 * the main body text on Pages: the site's default features, H2 to H4
 * headings and both toolbars.
 */
export const detailTab = (): Tab => ({
  label: 'Detail',
  fields: [
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      admin: { description: 'The full description. Also indexed for the knowledge base.' },
    },
    {
      name: 'whoItsFor',
      type: 'textarea',
      label: 'Who it is for',
      maxLength: 300,
      admin: { description: 'The teams or roles that use it, such as front desk or call centre.' },
    },
  ],
})
