import type { CollectionConfig, Field, Validate } from 'payload'

import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { faqTab } from '../fields/faq'
import { integrationSourceFields } from '../fields/integrationSource'
import { kbaseTab } from '../fields/kbase'
import { link } from '../fields/link'
import { plainText } from '../fields/validators/plainText'
import { masterOneMain, masterSlugRule, onlyNameToken } from './integrations/hooks'
import { integrationSeoTab, seoCheckField } from './integrations/seo'

/**
 * Integrations master: the landing pages for integrations, such as the main
 * /integrations page, and the shared wording every integration item page
 * uses (its section headings). One record has Is main on; item pages read
 * their headings from that record only.
 *
 * Visitors see published records only.
 */

// A link that appears, and is required, only once the sibling label or
// heading has text.
const linkShownWith = (sibling: string) =>
  link({
    appearances: false,
    disableLabel: true,
    overrides: {
      admin: { condition: (_: unknown, siblingData: any) => Boolean(siblingData?.[sibling]) },
    },
  })

const label = (name: string, title: string, example: string): Field => ({
  name,
  type: 'text',
  label: title,
  maxLength: 70,
  validate: onlyNameToken,
  admin: { description: `For example: ${example}` },
})

// Each category may have one section on the page.
const oneSectionPerCategory: Validate = (value) => {
  const ids = (Array.isArray(value) ? value : [])
    .map((row: { category?: unknown }) => {
      const c = row?.category
      return typeof c === 'object' && c ? String((c as { id: unknown }).id) : c ? String(c) : ''
    })
    .filter(Boolean)
  return new Set(ids).size === ids.length ? true : 'Each category can have only one section.'
}

// An optional heading for a section. Left empty, the page shows the default.
const sectionHeading = (name: string, title: string, fallback: string, maxLength = 70): Field => ({
  name,
  type: 'text',
  label: title,
  maxLength,
  validate: plainText,
  admin: { placeholder: fallback, description: `Leave empty to show: ${fallback}` },
})

const sidebar: Field[] = [
  {
    name: 'name',
    type: 'text',
    required: true,
    maxLength: 60,
    admin: { position: 'sidebar', description: 'For editors, for example Main integrations page.' },
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    maxLength: 60,
    validate: masterSlugRule,
    admin: {
      position: 'sidebar',
      description: 'Lowercase, dashes only. Cannot be the same as an integration item slug.',
    },
  },
  {
    name: 'isMain',
    type: 'checkbox',
    label: 'Is main',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description:
        'The main integrations page. Integration item pages take their section headings from this record. Only one record can have it on.',
    },
  },
  {
    name: 'filter',
    type: 'group',
    label: 'Which integrations',
    admin: {
      position: 'sidebar',
      description: 'Leave both empty to list every live integration.',
    },
    fields: [
      {
        name: 'categories',
        type: 'relationship',
        relationTo: 'integrationCategories',
        hasMany: true,
        admin: { sortOptions: 'order' },
      },
      {
        name: 'products',
        type: 'relationship',
        relationTo: 'products',
        hasMany: true,
        admin: { sortOptions: 'order' },
      },
    ],
  },
  seoCheckField('master'),
]

export const IntegrationsMaster: CollectionConfig = {
  slug: 'integrationsMaster',
  labels: { singular: 'Integrations master', plural: 'Integrations master' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isMain', 'updatedAt'],
    group: 'Integrations',
    description:
      'Integration landing pages, and the wording shared by every integration item page.',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [masterOneMain],
  },
  fields: [
    ...sidebar,
    {
      type: 'tabs',
      tabs: [
        integrationSeoTab(),
        {
          label: 'Hero',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              maxLength: 40,
              admin: { description: 'The small line above the heading, for example Integrations.' },
            },
            {
              name: 'h1',
              type: 'text',
              label: 'H1',
              required: true,
              maxLength: 70,
              admin: {
                description:
                  'The page heading, for example: Connect NeuronCx to the systems you already run.',
              },
            },
            {
              name: 'subheading',
              type: 'textarea',
              maxLength: 200,
            },
            {
              name: 'heroLayout',
              type: 'select',
              label: 'Hero layout',
              defaultValue: 'left',
              options: [
                { label: 'Left (image on the right)', value: 'left' },
                { label: 'Centred', value: 'centred' },
              ],
              admin: { description: 'Centred has no image.' },
            },
            {
              name: 'heroSystems',
              type: 'relationship',
              label: 'Systems in the hero',
              relationTo: 'integrations',
              hasMany: true,
              maxRows: 7,
              admin: { description: 'Up to 7 integrations shown around the hero.' },
            },
            {
              name: 'logoStripOn',
              type: 'checkbox',
              label: 'Logo strip (scrolling logos under the hero)',
              defaultValue: false,
            },
            {
              name: 'logoStrip',
              type: 'group',
              label: false,
              admin: { condition: (data) => Boolean(data?.logoStripOn) },
              fields: integrationSourceFields(
                { min: 4, max: 40 },
                { modes: ['all', 'filter', 'selection'], defaultMode: 'all' },
              ),
            },
            {
              name: 'hero',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'secondaryCta',
                  type: 'group',
                  label: 'Second button',
                  admin: {
                    description:
                      'Optional, next to the main button, for example: See Omnichannel CX. Type a label to choose where it goes.',
                  },
                  fields: [{ name: 'label', type: 'text', maxLength: 30 }, linkShownWith('label')],
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    condition: (data) => data?.heroLayout !== 'centred',
                    description:
                      'Optional. An illustration beside the hero, such as the hub diagram.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Integration sections',
          description:
            'The integration sections, in page order, each showing one category. Each section shows its text as typed here. Left empty, the page shows every category with its own name, hub heading and hub intro.',
          fields: [
            {
              name: 'integrationSections',
              type: 'array',
              label: 'Sections',
              labels: { singular: 'Section', plural: 'Sections' },
              validate: oneSectionPerCategory,
              admin: {
                components: {
                  RowLabel: '@/collections/integrations/SectionRowLabel#SectionRowLabel',
                },
              },
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'integrationCategories',
                  required: true,
                  admin: { sortOptions: 'order' },
                },
                {
                  name: 'eyebrow',
                  type: 'text',
                  maxLength: 60,
                  validate: plainText,
                  admin: { description: 'The small line above the heading, for example Telephony and dialers.' },
                },
                {
                  name: 'heading',
                  type: 'text',
                  maxLength: 70,
                  validate: plainText,
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  maxLength: 200,
                  validate: plainText,
                  admin: { description: 'Optional. Leave empty for no intro line.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Sections',
          fields: [
            sectionHeading(
              'fiveThingsHeading',
              'Five things heading',
              'What connecting your systems gives you',
            ),
            {
              name: 'fiveThings',
              type: 'array',
              label: 'Five things',
              labels: { singular: 'Thing', plural: 'Things' },
              minRows: 3,
              maxRows: 5,
              admin: { description: '3 to 5 points, each with a title and one line.' },
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 50 },
                { name: 'line', type: 'text', required: true, maxLength: 140 },
              ],
            },
            sectionHeading(
              'whenFeedsGoWrongHeading',
              'When feeds go wrong heading',
              'When feeds go wrong',
            ),
            {
              name: 'whenFeedsGoWrong',
              type: 'array',
              label: 'When feeds go wrong',
              labels: { singular: 'Problem', plural: 'Problems' },
              admin: {
                description:
                  'Common failures and what NeuronCx does, for example: The vendor stops sending updates.',
              },
              fields: [
                { name: 'problem', type: 'text', required: true, maxLength: 80 },
                {
                  name: 'whatHappens',
                  type: 'text',
                  label: 'What happens',
                  required: true,
                  maxLength: 160,
                },
              ],
            },
            {
              name: 'apiCard',
              type: 'group',
              label: 'API card',
              admin: { description: 'Type a heading to choose where the card links.' },
              fields: [
                { name: 'heading', type: 'text', maxLength: 60 },
                { name: 'line', type: 'text', maxLength: 140 },
                {
                  ...sectionHeading('buttonLabel', 'Button text', 'Get in touch', 30),
                  admin: {
                    placeholder: 'Get in touch',
                    description: 'Leave empty to show: Get in touch',
                    condition: (_: unknown, siblingData: any) => Boolean(siblingData?.heading),
                  },
                } as Field,
                linkShownWith('heading'),
              ],
            },
          ],
        },
        {
          label: 'Item page labels',
          description:
            "Section headings on every integration item page. Use {name} for the integration's name, for example: What moves between {name} and NeuronCx. Only the record with Is main on is used; on other records these are ignored.",
          fields: [
            {
              name: 'labels',
              type: 'group',
              label: false,
              fields: [
                label('statusTable', 'Status table', 'What moves between {name} and NeuronCx'),
                label('edgeCases', 'Edge cases', 'When things do not go to plan'),
                label('setup', 'Setup', 'What it takes to connect {name}'),
                label('related', 'Related', 'Other systems like {name}'),
              ],
            },
          ],
        },
        faqTab({ headingFallback: 'Questions about integrations' }),
        {
          label: 'Closing',
          fields: [
            {
              name: 'closing',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  maxLength: 70,
                  admin: {
                    description:
                      "The closing panel's heading, for example: Tell us what you're running.",
                  },
                },
                {
                  name: 'subheading',
                  type: 'textarea',
                  maxLength: 200,
                  admin: { description: 'One or two sentences under the heading.' },
                },
              ],
            },
            {
              name: 'cta',
              type: 'group',
              label: 'Call to action',
              admin: { description: 'The closing button. Type a label to choose where it goes.' },
              fields: [{ name: 'label', type: 'text', maxLength: 30 }, linkShownWith('label')],
            },
          ],
        },
        {
          label: 'WhatsApp',
          description: 'Plain text only. These limits are the ones WhatsApp enforces.',
          fields: [
            {
              name: 'waIntro',
              type: 'textarea',
              label: 'Intro message',
              maxLength: 1024,
              validate: plainText,
              admin: {
                description: 'Sent before the list of integrations. Aim for 300 characters.',
              },
            },
            {
              name: 'waListButton',
              type: 'text',
              label: 'List button',
              maxLength: 20,
              validate: plainText,
              admin: { description: 'The button that opens the list, for example See systems.' },
            },
            {
              name: 'waSectionTitle',
              type: 'text',
              label: 'Section title',
              maxLength: 24,
              validate: plainText,
              admin: { description: 'The heading above the rows in the list.' },
            },
            {
              name: 'waFallback',
              type: 'textarea',
              label: 'Fallback message',
              maxLength: 300,
              validate: plainText,
              admin: {
                description:
                  'Sent when someone asks about a system that is not listed, for example: We connect to most booking systems. Tell us which one you use.',
              },
            },
          ],
        },
        kbaseTab(),
      ],
    },
  ],
}
