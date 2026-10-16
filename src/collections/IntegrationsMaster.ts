import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { faqTab } from '../fields/faq'
import {
  closingTab,
  linkShownWith,
  masterRecordFields,
  masterWhatsappTab,
  pageLabel,
  sectionHeading,
} from '../fields/hub'
import { kbaseTab } from '../fields/kbase'
import { seoCheckField, seoTab } from '../fields/seo'
import { masterOneMain, masterSlugRule, onlyNameToken } from './integrations/hooks'

/**
 * Integrations master: the landing pages for integrations, such as the main
 * /integrations page, and the shared wording every integration item page
 * uses (its section headings). One record has Is main on; item pages read
 * their headings from that record only.
 *
 * Visitors see published records only.
 */

const label = (name: string, title: string, example: string): Field =>
  pageLabel(name, title, example, onlyNameToken)

const sidebar: Field[] = [
  ...masterRecordFields({
    name: 'For editors, for example Main integrations page.',
    slug: {
      validate: masterSlugRule,
      description: 'Lowercase, dashes only. Cannot be the same as an integration item slug.',
    },
    isMain:
      'The main integrations page. Integration item pages take their section headings from this record. Only one record can have it on.',
  }),
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
        seoTab({
          keywordDescription:
            'The search phrase this page should rank for, for example whatsapp crm integration.',
        }),
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
              name: 'heroSystems',
              type: 'relationship',
              label: 'Systems in the hero',
              relationTo: 'integrations',
              hasMany: true,
              maxRows: 7,
              admin: { description: 'Up to 7 integrations shown around the hero.' },
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
                    description:
                      'Optional. An illustration beside the hero, such as the hub diagram.',
                  },
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
        closingTab({
          headingDescription:
            "The closing panel's heading, for example: Tell us what you're running.",
        }),
        masterWhatsappTab({
          intro: 'Sent before the list of integrations. Aim for 300 characters.',
          listButton: 'The button that opens the list, for example See systems.',
          fallback:
            'Sent when someone asks about a system that is not listed, for example: We connect to most booking systems. Tell us which one you use.',
        }),
        kbaseTab(),
      ],
    },
  ],
}
