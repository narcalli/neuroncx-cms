import type { Block } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'
import type { TextFieldSingleValidation } from 'payload'

/**
 * A reusable FAQ list: a heading, an optional intro line, and a set of
 * question/answer pairs rendered as native <details>/<summary>, so opening
 * one needs no client JS. Answers are intentionally restricted to short,
 * simply formatted text — see the admin description on the array below.
 *
 * Self-contained, not wrapped with withPresentation/withMinimalPresentation:
 * its own `background` (white/cloud) and `anchorId` fields cover the same
 * ground as those wrappers' `background` and `htmlId`, and having both would
 * mean two fields writing the same concept. See Pages/index.ts where this
 * block is registered unwrapped.
 */
export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
      required: true,
      defaultValue: 'Frequently asked questions',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro',
      admin: { description: 'Optional. One short paragraph above the list.' },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Questions',
      required: true,
      minRows: 2,
      maxRows: 12,
      admin: {
        initCollapsed: true,
        description:
          'Keep answers short — roughly 40 to 60 words each. If one needs to run long, it should be the exception, not the pattern.',
        components: {
          RowLabel: '@/blocks/FAQ/RowLabel#FAQRowLabel',
        },
      },
      fields: [
        { name: 'question', type: 'text', label: 'Question', required: true },
        {
          name: 'answer',
          type: 'richText',
          label: 'Answer',
          required: true,
          editor: lexicalEditor({
            features: [
              ParagraphFeature(),
              BoldFeature(),
              ItalicFeature(),
              UnorderedListFeature(),
              LinkFeature({
                enabledCollections: ['pages', 'posts'],
                fields: ({ defaultFields }) => {
                  const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
                    if ('name' in field && field.name === 'url') return false
                    return true
                  })
                  return [
                    ...defaultFieldsWithoutUrl,
                    {
                      name: 'url',
                      type: 'text',
                      admin: {
                        condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
                      },
                      label: ({ t }) => t('fields:enterURL'),
                      required: true,
                      validate: ((value, options) => {
                        if ((options?.siblingData as LinkFields)?.linkType === 'internal') return true
                        return value ? true : 'URL is required'
                      }) as TextFieldSingleValidation,
                    },
                  ]
                },
              }),
              FixedToolbarFeature(),
            ],
          }),
        },
        {
          name: 'defaultOpen',
          type: 'checkbox',
          label: 'Open by default',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'background',
      type: 'select',
      label: 'Background',
      defaultValue: 'cloud',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Pale grey', value: 'cloud' },
      ],
    },
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor ID',
      admin: { description: 'Optional id for deep linking, e.g. faq' },
    },
    {
      name: 'emitSchema',
      type: 'checkbox',
      label: 'Output FAQPage structured data',
      defaultValue: true,
    },
  ],
}
