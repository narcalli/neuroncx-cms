import type { Field, Tab } from 'payload'

import { defineContentCollection } from '../../content/defineContentCollection'
import { countedText } from '../../fields/counted'
import { plainText } from '../../fields/validators/plainText'
import './sections'

/**
 * Bot swarm: one entry per small agent with one job, such as Payment
 * services. Spec: docs/cms/collections/micro_apps_swarm.md section 3, built
 * on the content foundation (docs/cms/foundation.md). Families are Lists
 * entries of type agentFamily.
 *
 * Every agent is described in five steps (hears, checks, acts, hands over,
 * records) on the Panel tab, which replaces the shared How it works list.
 */

const sidebar: Field[] = [
  {
    name: 'channel',
    type: 'select',
    hasMany: true,
    options: [
      { label: 'WhatsApp', value: 'whatsapp' },
      { label: 'Calls', value: 'calls' },
      { label: 'Web', value: 'web' },
    ],
    admin: { description: 'Where the agent works.' },
  },
  {
    name: 'verticals',
    type: 'select',
    hasMany: true,
    options: [
      { label: 'Healthcare', value: 'healthcare' },
      { label: 'Diagnostics', value: 'diagnostics' },
      { label: 'Education', value: 'education' },
      { label: 'Hospitality', value: 'hospitality' },
    ],
    admin: { description: 'Where it is used today.' },
  },
]

const detail: Field[] = [
  countedText({
    name: 'searchName',
    label: 'Search name',
    maxLength: 60,
    description:
      'The job people search for, such as Prescription reading AI. Used in the page title and the line under the heading.',
  }),
]

const card: Field[] = [
  {
    name: 'keyPoints',
    type: 'array',
    label: 'Key points',
    labels: { singular: 'Key point', plural: 'Key points' },
    minRows: 3,
    maxRows: 4,
    admin: { description: '3 to 4 short lines for cards and the bento grid.' },
    fields: [{ name: 'line', type: 'text', required: true, maxLength: 60, validate: plainText }],
  },
]

const panel: Tab = {
  label: 'Panel',
  description: 'The five steps every agent is described in, plus what starts it and what it changes.',
  fields: [
    countedText({ name: 'startsWhen', label: 'Starts when', textarea: true, maxLength: 200, description: 'What sets the agent off.' }),
    countedText({
      name: 'customerSees',
      label: 'Customer sees (chat agents only)',
      textarea: true,
      maxLength: 240,
      description: 'Leave empty for agents that work on call recordings.',
    }),
    countedText({
      name: 'hears',
      label: 'Hears',
      textarea: true,
      maxLength: 200,
      description: "The request in the customer's own words, or the call recording.",
    }),
    countedText({
      name: 'checks',
      label: 'Checks',
      textarea: true,
      maxLength: 300,
      description: "The organisation's own rules: locations, services, prices, slots, scoring sheets.",
    }),
    countedText({
      name: 'acts',
      label: 'Acts',
      textarea: true,
      maxLength: 300,
      description: "The work done in the organisation's systems: books, charges, files, scores.",
    }),
    countedText({
      name: 'handsOver',
      label: 'Hands over',
      textarea: true,
      maxLength: 240,
      description: 'When and how a person takes over. Fill this in before turning on Own page.',
    }),
    countedText({
      name: 'records',
      label: 'Records',
      textarea: true,
      maxLength: 200,
      description: 'What is logged, and where.',
    }),
    countedText({
      name: 'teamControls',
      label: 'Team controls',
      textarea: true,
      maxLength: 240,
      description: 'What the organisation can change from the dashboard without code.',
    }),
    countedText({
      name: 'result',
      label: 'Result',
      maxLength: 140,
      description: 'One line on what changes for the team.',
    }),
    {
      name: 'passesTo',
      type: 'relationship',
      label: 'Passes to',
      relationTo: 'microApps',
      hasMany: true,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        sortOptions: 'order',
        description:
          'The next agent in the chain, such as Prescription understanding to Test matching and pricing. Leave empty for the last agent.',
      },
    },
  ],
}

const page: Field[] = [
  countedText({
    name: 'proof',
    label: 'Proof',
    maxLength: 140,
    description:
      "One line, such as Live at a diagnostics chain. Name a customer only where the customers collection's Show real name is on.",
  }),
  {
    name: 'customers',
    type: 'relationship',
    label: 'Live at',
    relationTo: 'customers',
    hasMany: true,
    admin: { sortOptions: 'order' },
  },
  {
    name: 'integrations',
    type: 'relationship',
    label: 'Works with',
    relationTo: 'integrations',
    hasMany: true,
    admin: { sortOptions: 'order', description: 'Systems it books, bills or files into.' },
  },
  {
    name: 'crmFeatures',
    type: 'relationship',
    label: 'Depends on (CRM features)',
    relationTo: 'crmFeatures',
    hasMany: true,
    admin: { sortOptions: 'order', description: 'Usually Customer 360.' },
  },
  // TODO: callQualityAssessments (relationship, hasMany, call quality agents
  // only), once that collection exists.
  // TODO: episodicEngagements (relationship, hasMany), once that collection exists.
  {
    name: 'media',
    type: 'upload',
    label: 'Flow graphic or screenshot',
    relationTo: 'media',
    admin: { description: 'Optional, such as the payment flow.' },
  },
]

export const MicroApps = defineContentCollection({
  slug: 'microApps',
  label: { singular: 'Agent', plural: 'Bot swarm' },
  adminGroup: 'Bot swarm',
  route: '/bot-swarm',
  groupBy: { listType: 'agentFamily', field: 'family', required: true },
  groups: ['core', 'card', 'detail', 'ownPage', 'faq', 'whatsapp', 'kbase'],
  ownPage: { omit: ['howItWorks'] },
  fields: { sidebar, detail, card, page },
  extraTabs: [{ after: 'detail', tab: panel }],
  sections: [
    'agentPanel',
    'agentChain',
    'agentTeamControls',
    'agentResult',
    'benefits',
    'useCases',
    'integrations',
    'customers',
    'faq',
    { key: 'related', headingDefault: 'Other agents in {family}' },
    'closing',
  ],
  // The agent page in micro_apps_swarm.md section 9. The published hub's
  // default entry layout replaces it. The closing panel is fixed at the end.
  defaultLayout: [
    'agentPanel',
    'agentChain',
    'agentTeamControls',
    'agentResult',
    'useCases',
    'integrations',
    'faq',
    'related',
  ],
  kb: { resolve: ['family', 'integrations', 'passesTo', 'customers'] },
  admin: {
    defaultColumns: ['name', 'family', 'status', 'channel', 'hasOwnPage', 'updatedAt'],
    // Family by its own order, then the agent's order within it.
    defaultSort: ['family.order', 'order'],
  },
})
