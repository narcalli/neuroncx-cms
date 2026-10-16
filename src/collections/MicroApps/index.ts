import type { Access, CollectionConfig, Field, Tab, Where } from 'payload'

import { authenticated } from '../../access/authenticated'
import { cardTab } from '../../fields/card'
import {
  featuredField,
  isUSPField,
  nameField,
  orderField,
  slugField,
  statusField,
} from '../../fields/core'
import { detailTab } from '../../fields/detail'
import { faqTab } from '../../fields/faq'
import { kbaseTab } from '../../fields/kbase'
import { hasOwnPageField, ownPageTab, titleLineList } from '../../fields/ownPage'
import { seoCheckField, seoTab } from '../../fields/seo'
import { plainText } from '../../fields/validators/plainText'
import { whatsappTab } from '../../fields/whatsapp'
import {
  microAppFallbacks,
  microAppRefreshFamilies,
  microAppRefreshFamiliesAfterDelete,
  microAppSlugRule,
  notItself,
  ownPageRule,
  plainForOwnPage,
} from './hooks'

// Visitors get published entries whose status is Live or Pilot; the site
// tags Pilot ones. Planned entries and drafts stay with logged-in editors.
// Relationships obey this too, so a linked planned agent is not populated.
const liveOrPilotOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  const publishedLiveOrPilot: Where = {
    and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
  }
  return publishedLiveOrPilot
}

/**
 * Micro-apps swarm: the small agents of the bot swarm, each with one job,
 * such as Payment services. Spec: docs/cms/collections/micro_apps_swarm.md.
 *
 * Drafts are on, with no autosave. Visitors never see a draft or a Planned
 * agent; see liveOrPilotOrAuthenticated above.
 *
 * Uses the shared groups in src/fields. Agent pages are at /bot-swarm/[slug];
 * the hub copy is in the bot swarm master (MicroAppsMaster.ts). Fallbacks,
 * the WhatsApp row, waLink, the own page rule and the family refresh:
 * MicroApps/hooks.ts.
 */

const sidebar: Field[] = [
  statusField({
    defaultValue: 'planned',
    description: 'Live and Pilot show on the public site, Pilot with a tag. Planned stays hidden.',
  }),
  {
    name: 'family',
    type: 'relationship',
    relationTo: 'agentFamilies',
    required: true,
    admin: {
      position: 'sidebar',
      sortOptions: 'order',
      description: 'Groups agents on the hub and in WhatsApp menus.',
    },
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
    admin: { position: 'sidebar', description: 'Where the agent works.' },
  },
  {
    name: 'verticals',
    type: 'relationship',
    relationTo: 'sectors',
    hasMany: true,
    admin: {
      position: 'sidebar',
      sortOptions: 'order',
      description: 'The sectors where it is used today.',
    },
  },
  featuredField({ description: 'Tick to include in the short list on the home page.' }),
  isUSPField({ description: 'Marks an agent that most sets NeuronCx apart, so blocks can pull it out.' }),
  orderField({ description: 'Lower numbers show first.' }),
  slugField({
    required: true,
    fromName: true,
    validate: microAppSlugRule,
    description:
      'Used in the address /bot-swarm/<slug>. Filled in from the name when the agent is created, and can be changed. Lowercase, dashes only. Cannot be the same as a bot swarm master record slug.',
  }),
  hasOwnPageField({
    validate: ownPageRule,
    description:
      'Gives this agent a page at /bot-swarm/<slug>. The Page tab appears while this is on. Publishing then needs status Live, a hero heading, every Panel field except Customer sees, proof, and an SEO title and description.',
  }),
  seoCheckField('item'),
]

const OWN_PAGE_NOTE = 'Needed to publish with Own page on.'

/**
 * A Panel field: plain text, and needed for an own page unless optional.
 * `what` completes the error "Add <what> before publishing with Own page on."
 */
const panelField = (opts: {
  name: string
  label: string
  what?: string
  type?: 'text' | 'textarea'
  maxLength: number
  description: string
  optional?: boolean
}): Field =>
  ({
    name: opts.name,
    type: opts.type || 'textarea',
    label: opts.label,
    maxLength: opts.maxLength,
    validate: opts.optional ? plainText : plainForOwnPage(opts.what || opts.label),
    admin: {
      description: opts.optional ? opts.description : `${opts.description} ${OWN_PAGE_NOTE}`,
    },
  }) as Field

const card = cardTab({
  image: { name: 'image', description: 'Optional. A picture for cards, where a block shows one.' },
  icon: { description: 'Shown on cards.' },
  tagline: { description: 'What it does, under the name. Aim for 45 characters.' },
  summary: {
    maxLength: 140,
    required: true,
    description: 'What the team no longer does, in one line. Aim for 120 characters.',
  },
  extra: [
    {
      name: 'keyPoints',
      type: 'array',
      label: 'Key points',
      labels: { singular: 'Key point', plural: 'Key points' },
      minRows: 3,
      maxRows: 4,
      admin: {
        description:
          '3 to 4 short lines for cards and the bento grid, for example: Sends the link as soon as a booking is made.',
      },
      fields: [{ name: 'line', type: 'text', required: true, maxLength: 60, validate: plainText }],
    },
  ],
})

const detail = detailTab({
  description: 'The agent explained in plain words.',
  whoItsFor: 'The teams that use it, for example front desk, call centre, admissions office or QA.',
  extra: [
    {
      name: 'searchName',
      type: 'text',
      label: 'Search name',
      maxLength: 60,
      validate: plainText,
      admin: {
        description:
          'The job people search for, for example Prescription reading AI. Used in the page title and the line under the H1.',
      },
    },
  ],
})

const panel: Tab = {
  label: 'Panel',
  description:
    'Every agent is described the same way: what starts it, then hears, checks, acts, hands over and records.',
  fields: [
    panelField({
      name: 'startsWhen',
      what: 'what starts the agent',
      label: 'Starts when',
      maxLength: 200,
      description: 'What sets the agent off, for example: A booking or order is created.',
    }),
    panelField({
      name: 'customerSees',
      label: 'Customer sees',
      maxLength: 240,
      optional: true,
      description: 'What the customer sees. Leave empty for agents that work on call recordings.',
    }),
    panelField({
      name: 'hears',
      what: 'what the agent hears',
      label: 'Hears',
      maxLength: 200,
      description: "The request in the customer's own words, or the call recording.",
    }),
    panelField({
      name: 'checks',
      what: 'what the agent checks',
      label: 'Checks',
      maxLength: 300,
      description:
        "The organisation's own rules it checks, such as locations, services, prices, slots or scoring sheets.",
    }),
    panelField({
      name: 'acts',
      what: 'what the agent does',
      label: 'Acts',
      maxLength: 300,
      description: "The work done in the organisation's systems, such as booking, charging, filing or scoring.",
    }),
    panelField({
      name: 'handsOver',
      what: 'when a person takes over',
      label: 'Hands over',
      maxLength: 240,
      description: 'When and how a person takes over.',
    }),
    panelField({
      name: 'records',
      what: 'what the agent records',
      label: 'Records',
      maxLength: 200,
      description: 'What is logged, and where.',
    }),
    panelField({
      name: 'teamControls',
      what: 'what the team controls',
      label: 'Team controls',
      maxLength: 240,
      description: 'What the organisation can change from the dashboard without code.',
    }),
    panelField({
      name: 'result',
      what: 'a result line',
      label: 'Result',
      type: 'text',
      maxLength: 140,
      description: 'One line on what changes for the team.',
    }),
    {
      name: 'passesTo',
      type: 'relationship',
      relationTo: 'microApps',
      hasMany: true,
      label: 'Passes to',
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      validate: notItself,
      admin: {
        description:
          'The next agent in the chain, for example Prescription understanding passes to Test matching and pricing.',
      },
    },
  ],
}

const page = ownPageTab({
  heroHeading: {
    description:
      'The outcome, for example: Payment links that follow through on their own. Needed to publish with Own page on.',
  },
  heroSubheading: { description: 'What the agent does and for whom, in two sentences.' },
  afterHero: [
    titleLineList({
      name: 'benefits',
      label: 'Benefits',
      singular: 'Benefit',
      plural: 'Benefits',
      minRows: 3,
      maxRows: 4,
      description: '3 to 4. What the team gains, each as a short title and one line.',
    }),
    titleLineList({
      name: 'useCases',
      label: 'Use cases',
      singular: 'Use case',
      plural: 'Use cases',
      maxRows: 4,
      description: 'One per sector, up to 4. A short title, such as Healthcare, and one line.',
    }),
  ],
  cta: { description: 'The closing button. Type a label to choose where it goes.' },
  related: {
    relationTo: 'microApps',
    description: 'Up to 3. Leave empty to show other agents in the same family.',
  },
  headingOverrides: {
    description:
      'Optional. Leave empty to use the agent page labels from the main bot swarm master record.',
    keys: [
      ['panel', 'Panel'],
      ['chain', 'Chain'],
      ['teamControls', 'Team controls'],
      ['result', 'Result and proof'],
      ['useCases', 'Use cases'],
      ['worksWith', 'Works with'],
      ['faq', 'FAQ'],
      ['related', 'Related'],
    ],
  },
  extra: [
    {
      name: 'proof',
      type: 'text',
      label: 'Proof',
      maxLength: 140,
      validate: plainForOwnPage('a proof line'),
      admin: {
        description:
          "One line, for example: Live at a diagnostics chain. Name a customer only where the customer's Show name allows it. Needed to publish with Own page on.",
      },
    },
    {
      name: 'customers',
      type: 'relationship',
      relationTo: 'customers',
      hasMany: true,
      admin: { description: 'Where it is live.' },
    },
    {
      name: 'integrations',
      type: 'relationship',
      relationTo: 'integrations',
      hasMany: true,
      admin: { description: 'Systems it books, bills or files into.' },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'A flow graphic or screenshot, for example the payment flow.' },
    },
  ],
})

const whatsapp = whatsappTab({
  buttonActions: [
    { label: 'Book a demo', value: 'bookDemo' },
    { label: 'Other agents', value: 'otherAgents' },
    { label: 'Talk to sales', value: 'talkToSales' },
    { label: 'Open the page', value: 'openPage' },
  ],
  headerType: true,
  linkLabel: true,
  linkSetByHook:
    'Set automatically: /bot-swarm/<slug> when Own page is on, otherwise /bot-swarm#<slug>.',
  rowTitleFromName: true,
})

const seo = seoTab({
  keywordDescription:
    'The search phrase this page should rank for, for example whatsapp payment link. Used in the SEO title when that is left empty.',
  ownPage: {
    titleDescription:
      'Left empty, it is filled as "<primary keyword> with NeuronCx | NeuronCx", or the name if there is no keyword. Needed to publish with Own page on.',
    descriptionDescription: 'Left empty, it is filled from the summary. Needed to publish with Own page on.',
  },
})

export const MicroApps: CollectionConfig = {
  slug: 'microApps',
  labels: {
    singular: 'Micro-app',
    plural: 'Micro-apps swarm',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: liveOrPilotOrAuthenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'family', 'status', 'hasOwnPage'],
    description:
      'The bot swarm: small agents with one job each, such as Payment services. Each entry is written once and shown wherever agents are listed.',
    group: 'Bot swarm',
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [microAppFallbacks],
    afterChange: [microAppRefreshFamilies],
    afterDelete: [microAppRefreshFamiliesAfterDelete],
  },
  fields: [
    nameField({ maxLength: 60 }),
    ...sidebar,
    {
      type: 'tabs',
      tabs: [card, detail, panel, page, faqTab(), whatsapp, kbaseTab(), seo],
    },
  ],
}
