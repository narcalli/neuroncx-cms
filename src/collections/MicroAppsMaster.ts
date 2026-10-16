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
} from '../fields/hub'
import { kbaseTab } from '../fields/kbase'
import { seoCheckField, seoTab } from '../fields/seo'
import { plainText } from '../fields/validators/plainText'
import {
  agentLabelRule,
  hidePendingRows,
  microAppsMasterOneMain,
  microAppsMasterSlugRule,
} from './MicroApps/hooks'

/**
 * Bot swarm master: the copy for the bot swarm hub, and the shared wording
 * every agent page uses (its section headings). Built like the
 * integrations master. One record has Is main on; agent pages read their
 * headings from that record only. Spec: docs/cms/collections/micro_apps_swarm.md.
 *
 * Visitors see published records only. Proof strip rows marked pending are
 * never sent to visitors (hidePendingRows).
 */

const label = (name: string, title: string, example: string): Field =>
  pageLabel(name, title, example, agentLabelRule)

/** A section's heading. The page leaves the section out while it is empty. */
const heading = (name: string, title: string, description: string): Field => ({
  name,
  type: 'text',
  label: title,
  maxLength: 70,
  validate: plainText,
  admin: { description },
})

/** A list of points with a short title and one line. */
const titleLine = (titleMax: number): Field[] => [
  { name: 'title', type: 'text', required: true, maxLength: titleMax },
  { name: 'line', type: 'text', required: true, maxLength: 140 },
]

const LEFT_OUT = 'The section is left out of the page while it has no rows.'

const sidebar: Field[] = [
  ...masterRecordFields({
    name: 'For editors, for example Main bot swarm page.',
    slug: {
      validate: microAppsMasterSlugRule,
      description: 'Lowercase, dashes only. Cannot be the same as an agent slug.',
    },
    isMain:
      'The main bot swarm page. Agent pages take their section headings from this record. Only one record can have it on.',
  }),
  {
    name: 'filter',
    type: 'group',
    label: 'Which agents',
    admin: {
      position: 'sidebar',
      description: 'Leave all three empty to list every live and pilot agent.',
    },
    fields: [
      {
        name: 'families',
        type: 'relationship',
        relationTo: 'agentFamilies',
        hasMany: true,
        admin: { sortOptions: 'order' },
      },
      {
        name: 'sectors',
        type: 'relationship',
        relationTo: 'sectors',
        hasMany: true,
        admin: { sortOptions: 'order' },
      },
      {
        name: 'channel',
        type: 'select',
        hasMany: true,
        options: [
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'Calls', value: 'calls' },
          { label: 'Web', value: 'web' },
        ],
      },
    ],
  },
  seoCheckField('master'),
]

export const MicroAppsMaster: CollectionConfig = {
  slug: 'microAppsMaster',
  labels: { singular: 'Bot swarm master', plural: 'Bot swarm master' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isMain', 'updatedAt'],
    group: 'Bot swarm',
    description: 'The bot swarm hub copy, and the wording shared by every agent page.',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [microAppsMasterOneMain],
  },
  fields: [
    ...sidebar,
    {
      type: 'tabs',
      tabs: [
        seoTab({
          keywordDescription:
            'The search phrase this page should rank for, for example ai agents for customer service.',
        }),
        {
          label: 'Hero',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              maxLength: 40,
              admin: { description: 'The small line above the heading, for example Bot swarm.' },
            },
            {
              name: 'h1',
              type: 'text',
              label: 'H1',
              required: true,
              maxLength: 70,
              admin: {
                description:
                  'The page heading, for example: Small agents that each finish one job.',
              },
            },
            {
              name: 'subheading',
              type: 'textarea',
              maxLength: 200,
            },
            {
              name: 'heroAgents',
              type: 'relationship',
              label: 'Agents in the hero',
              relationTo: 'microApps',
              hasMany: true,
              maxRows: 4,
              admin: { description: 'Up to 4 agents, shown as chips in the hero.' },
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
                    description: 'Optional. An illustration beside the hero, such as the chat panel.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Sections',
          description: 'Each section has its own heading. A section with nothing in it is left out of the page.',
          fields: [
            heading(
              'introHeading',
              'Intro heading',
              'For example: One record, many small agents. The section is left out while the intro is empty.',
            ),
            {
              name: 'intro',
              type: 'richText',
              admin: { description: 'A short introduction under the hero.' },
            },
            heading('proofStripHeading', 'Proof strip heading', 'For example: In use today.'),
            {
              name: 'proofStrip',
              type: 'array',
              label: 'Proof strip',
              labels: { singular: 'Figure', plural: 'Figures' },
              maxRows: 4,
              hooks: { afterRead: [hidePendingRows] },
              admin: {
                description: `Up to 4 confirmed figures. Tick Pending for a figure that is not confirmed yet: it is kept here and never shown on the site. ${LEFT_OUT}`,
              },
              fields: [
                {
                  name: 'figure',
                  type: 'text',
                  required: true,
                  maxLength: 20,
                  admin: { description: 'For example 3 agents.' },
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  maxLength: 60,
                  admin: { description: 'For example: in one conversation, with no retyping.' },
                },
                {
                  name: 'pending',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Not confirmed yet. Never shown on the site.' },
                },
              ],
            },
            heading('comparisonHeading', 'Comparison heading', 'For example: Menu bots and agents.'),
            {
              name: 'comparison',
              type: 'array',
              label: 'Comparison',
              labels: { singular: 'Row', plural: 'Rows' },
              maxRows: 5,
              admin: { description: `Up to 5 rows, the old way beside the way with agents. ${LEFT_OUT}` },
              fields: [
                {
                  name: 'oldWay',
                  type: 'text',
                  label: 'The old way',
                  required: true,
                  maxLength: 120,
                },
                {
                  name: 'withAgents',
                  type: 'text',
                  label: 'With agents',
                  required: true,
                  maxLength: 120,
                },
              ],
            },
            heading('fiveStepsHeading', 'Five steps heading', 'For example: How every agent works.'),
            {
              name: 'fiveSteps',
              type: 'array',
              label: 'Five steps',
              labels: { singular: 'Step', plural: 'Steps' },
              minRows: 5,
              maxRows: 5,
              admin: {
                description: `Exactly 5: hears, checks, acts, hands over, records. ${LEFT_OUT}`,
              },
              fields: titleLine(30),
            },
            heading('underneathHeading', 'Underneath heading', 'For example: What sits underneath.'),
            {
              name: 'underneath',
              type: 'array',
              label: 'Underneath',
              labels: { singular: 'Column', plural: 'Columns' },
              minRows: 3,
              maxRows: 3,
              admin: { description: `Exactly 3 columns. ${LEFT_OUT}` },
              fields: titleLine(50),
            },
            heading(
              'worksWithHeading',
              'Works with heading',
              'For example: Works with the systems you run. The integrations come from the agents on the page. The section is left out while this heading is empty.',
            ),
            heading('byIndustryHeading', 'By industry heading', 'For example: By industry.'),
            {
              name: 'byIndustry',
              type: 'array',
              label: 'By industry',
              labels: { singular: 'Industry', plural: 'Industries' },
              maxRows: 4,
              admin: { description: `Up to 4, one per sector. ${LEFT_OUT}` },
              fields: [
                {
                  name: 'sector',
                  type: 'relationship',
                  relationTo: 'sectors',
                  required: true,
                },
                ...titleLine(50),
              ],
            },
            heading('trustCardsHeading', 'Trust cards heading', 'For example: You stay in charge.'),
            {
              name: 'trustCards',
              type: 'array',
              label: 'Trust cards',
              labels: { singular: 'Card', plural: 'Cards' },
              maxRows: 4,
              admin: { description: `Up to 4. ${LEFT_OUT}` },
              fields: titleLine(50),
            },
          ],
        },
        {
          label: 'Agent page labels',
          description:
            "Section headings on every agent page. Use {name} for the agent's name, for example: How {name} works. Only the record with Is main on is used; on other records these are ignored. An agent's own Section headings replace these on that agent's page.",
          fields: [
            {
              name: 'labels',
              type: 'group',
              label: false,
              fields: [
                label('panel', 'Panel', 'How {name} works'),
                label('chain', 'Chain', 'Where {name} sits in the chain'),
                label('teamControls', 'Team controls', 'What your team controls'),
                label('result', 'Result and proof', 'What changes for your team'),
                label('useCases', 'Use cases', 'Where {name} is used'),
                label('worksWith', 'Works with', 'Systems {name} works with'),
                label('related', 'Related', 'Other agents in this family'),
              ],
            },
          ],
        },
        faqTab({ headingFallback: 'Questions about the bot swarm' }),
        closingTab({
          headingDescription:
            "The closing panel's heading, for example: Tell us which job to take off your team.",
        }),
        masterWhatsappTab({
          intro: 'Sent before the list of agent families. Aim for 300 characters.',
          listButton: 'The button that opens the list, for example See agents.',
          fallback:
            'Sent when someone asks about a job no agent does yet, for example: Tell us which job takes your team the most time.',
        }),
        kbaseTab(),
      ],
    },
  ],
}
