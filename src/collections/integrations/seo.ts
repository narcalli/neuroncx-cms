import type { Tab } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { requiredForOwnPage } from './hooks'

/**
 * The SEO tab for integration items and the integrations master: keywords,
 * then the SEO plugin fields under meta (meta.title, meta.description,
 * meta.image), as on Pages. The plugin's generate buttons are off: they are
 * written for Pages and Posts and would produce the wrong title here.
 */
export const integrationSeoTab = (opts: { forItems?: boolean } = {}): Tab => ({
  label: 'SEO',
  fields: [
    {
      name: 'primaryKeyword',
      type: 'text',
      label: 'Primary keyword',
      maxLength: 60,
      admin: {
        description: opts.forItems
          ? 'The search phrase this page should rank for, for example docpulse whatsapp appointment booking. Used in the SEO title when that is left empty.'
          : 'The search phrase this page should rank for, for example whatsapp crm integration.',
      },
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
            ...(opts.forItems
              ? {
                  validate: requiredForOwnPage('an SEO title'),
                  admin: {
                    description:
                      'Left empty, it is filled as "<primary keyword> with NeuronCx | NeuronCx", or the name if there is no keyword. Needed to publish with Own page on.',
                  },
                }
              : {}),
          },
        }),
        MetaImageField({ relationTo: 'media' }),
        MetaDescriptionField({
          hasGenerateFn: false,
          overrides: {
            maxLength: 155,
            ...(opts.forItems
              ? {
                  validate: requiredForOwnPage('an SEO description'),
                  admin: {
                    description:
                      'Left empty, it is filled from the summary. Needed to publish with Own page on.',
                  },
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
