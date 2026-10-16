import type { Access, CollectionConfig, Field, Where } from 'payload'

import { authenticated } from '../access/authenticated'
import { cardTab as sharedCardTab } from '../fields/card'
import { featuredField, nameField, orderField, slugField, statusField } from '../fields/core'
import { faqTab } from '../fields/faq'
import { kbaseTab } from '../fields/kbase'
import { hasOwnPageField, ownPageTab } from '../fields/ownPage'
import { seoCheckField, seoTab } from '../fields/seo'
import { plainText } from '../fields/validators/plainText'
import { whatsappTab } from '../fields/whatsapp'
import { checklistFields } from './integrations/checklist'
import {
  itemFallbacks,
  itemRefreshCategories,
  itemRefreshCategoriesAfterDelete,
  itemSlugRule,
} from './integrations/hooks'

// Visitors only ever get entries that are both published and Live. Drafts,
// Pilot and Planned stay visible to logged-in editors only. Relationships
// obey this too, so a hand-picked entry that is not live is not populated.
const liveOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  const publishedAndLive: Where = {
    and: [{ _status: { equals: 'published' } }, { status: { equals: 'live' } }],
  }
  return publishedAndLive
}

/**
 * Integration items: the systems NeuronCx connects to, kept in one place so
 * every page that lists integrations reads the same entries instead of its
 * own copy. Spec: docs/cms/collections/integrations.md.
 *
 * Drafts are on: an entry can be prepared and saved without appearing on
 * the site until it is published. Visitors also never see an entry whose
 * status is not Live; see liveOrAuthenticated above.
 *
 * Category, connection and products link to their own collections
 * (IntegrationTaxonomies.ts), so editors manage those lists in the admin.
 * Fallbacks, waLink and the checklist prefill: integrations/hooks.ts.
 * The Core, Card, Own page and SEO fields come from the shared groups in
 * src/fields, with this collection's own names, limits and wording.
 */

// Sidebar: the existing tagging fields, the slug and the own page switch.
const sidebar: Field[] = [
  statusField({ defaultValue: 'live', description: 'Only Live integrations show on the public site.' }),
  {
    name: 'category',
    type: 'relationship',
    relationTo: 'integrationCategories',
    required: true,
    admin: { position: 'sidebar', sortOptions: 'order' },
  },
  {
    name: 'connection',
    type: 'relationship',
    relationTo: 'connectionTypes',
    admin: { position: 'sidebar', sortOptions: 'order' },
  },
  {
    name: 'products',
    type: 'relationship',
    relationTo: 'products',
    hasMany: true,
    admin: { position: 'sidebar', sortOptions: 'order' },
  },
  featuredField({ description: 'Tick to include in the short list on the home page.' }),
  orderField({ description: 'Lower numbers show first.' }),
  slugField({
    validate: itemSlugRule,
    description: 'Used in the address /integrations/<slug>. Needed to publish with Own page on.',
  }),
  hasOwnPageField({
    description:
      'Gives this integration a page at /integrations/<slug>. The Page tab appears while this is on. Publishing then needs a slug, a hero heading and an SEO title and description.',
  }),
  seoCheckField('item'),
]

// The WhatsApp tab, with the preview at the top and the "Fill from status
// flow" button just above the key points.
const whatsapp = (() => {
  const tab = whatsappTab({
    buttonActions: [
      { label: 'Book a demo', value: 'bookDemo' },
      { label: 'Other systems', value: 'otherSystems' },
      { label: 'Talk to sales', value: 'talkToSales' },
      { label: 'Open the page', value: 'openPage' },
    ],
    headerType: true,
    linkLabel: true,
    linkSetByHook:
      'Set automatically: /integrations/<slug> when Own page is on, otherwise /integrations#<slug>. Empty while there is no slug.',
  })
  const fields = [...tab.fields]
  const keyPoints = fields.findIndex((f) => 'name' in f && f.name === 'waKeyPoints')
  fields.splice(keyPoints, 0, {
    name: 'fillKeyPoints',
    type: 'ui',
    admin: {
      components: { Field: '@/collections/integrations/admin/FillKeyPoints#FillKeyPoints' },
    },
  })
  fields.unshift({
    name: 'whatsappPreview',
    type: 'ui',
    admin: {
      components: { Field: '@/collections/integrations/admin/WhatsappPreview#WhatsappPreview' },
    },
  })
  return { ...tab, fields }
})()

const cardTab = sharedCardTab({
  image: { name: 'logo', description: 'Transparent PNG or SVG. Leave empty to show the name only.' },
  tagline: { description: 'A short line under the name. Aim for 45 characters.' },
  summary: { maxLength: 120, description: 'What flows between the two systems, in plain words.' },
  extra: [
    {
      name: 'glance',
      type: 'array',
      label: 'At a glance',
      labels: { singular: 'Point', plural: 'Points' },
      minRows: 3,
      maxRows: 4,
      admin: {
        description:
          '3 to 4 short claims for the strip under the page hero, for example: Every status tracked.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 40 },
        { name: 'line', type: 'text', required: true, maxLength: 60 },
      ],
    },
  ],
})

const pageTab = ownPageTab({
  heroHeading: {
    description:
      'An action, the partner name and the result, for example: Book DocPulse appointments on WhatsApp. Needed to publish with Own page on.',
  },
  heroSubheading: { description: 'Who does what, and what lands where, in two sentences.' },
  cta: { description: 'The closing button. Type a label to choose where it goes.' },
  showClosing: {
    description:
      'The dark panel at the end of the page, with the heading and text from the main integrations master record. Off leaves it out on this page only.',
  },
  related: {
    relationTo: 'integrations',
    description: 'Up to 3. Leave empty to show other live integrations in the same category.',
  },
  headingOverrides: {
    description: 'Leave empty to use the headings from the main integrations master record.',
    keys: [
      ['statusTable', 'Status table'],
      ['edgeCases', 'Edge cases'],
      ['setup', 'Setup'],
      ['related', 'Related'],
    ],
  },
})

const whatMovesTab = {
  label: 'What moves',
  fields: [
    {
      name: 'statusFlow',
      type: 'array',
      label: 'Status flow',
      labels: { singular: 'Status', plural: 'Statuses' },
      admin: {
        description:
          'Each status change and what NeuronCx does with it, for example: Booked / Scheduled / The patient gets a WhatsApp confirmation.',
      },
      fields: [
        { name: 'event', type: 'text', required: true, maxLength: 40 },
        { name: 'inPartner', type: 'text', label: 'In the partner system', maxLength: 40 },
        {
          name: 'whatHappens',
          type: 'text',
          label: 'What happens',
          required: true,
          maxLength: 120,
        },
      ],
    },
  ] as Field[],
}

const edgeCasesTab = {
  label: 'Edge cases',
  fields: [
    {
      name: 'edgeCases',
      type: 'array',
      label: 'Edge cases',
      labels: { singular: 'Edge case', plural: 'Edge cases' },
      admin: {
        description:
          'What happens when things do not go to plan, for example: The slot was taken in the meantime.',
      },
      fields: [
        { name: 'situation', type: 'text', required: true, maxLength: 80 },
        {
          name: 'whatWeDo',
          type: 'text',
          label: 'What NeuronCx does',
          required: true,
          maxLength: 160,
        },
      ],
    },
  ] as Field[],
}

const setupTab = {
  label: 'Setup',
  fields: [
    {
      name: 'setupChecklist',
      type: 'array',
      label: 'Setup checklist',
      labels: { singular: 'Step', plural: 'Steps' },
      admin: {
        description:
          "What has to happen to connect. Filled from the connection type's default checklist when a connection is set and this is empty.",
      },
      fields: checklistFields(),
    },
    {
      // Set by the prefill hook: the connection type the checklist was last
      // filled from, so a checklist the editor cleared stays clear.
      name: 'setupChecklistSource',
      type: 'text',
      admin: { hidden: true },
    },
  ] as Field[],
}

const exampleTab = {
  label: 'Example',
  fields: [
    {
      name: 'chatExample',
      type: 'array',
      label: 'Chat example',
      labels: { singular: 'Message', plural: 'Messages' },
      maxRows: 8,
      admin: {
        description: 'A short example conversation, up to 8 messages. Demo-tenant details only.',
      },
      fields: [
        {
          name: 'sender',
          type: 'select',
          required: true,
          options: [
            { label: 'Customer', value: 'customer' },
            { label: 'Business', value: 'business' },
            { label: 'Team', value: 'team' },
          ],
        },
        {
          name: 'time',
          type: 'text',
          maxLength: 10,
          admin: { description: 'For example 11:42.' },
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          maxLength: 300,
          validate: plainText,
        },
        {
          name: 'label',
          type: 'text',
          maxLength: 40,
          admin: {
            description: 'Optional. Names the agent or step, for example Payment services.',
          },
        },
      ],
    },
  ] as Field[],
}

const integrationSeoTab = seoTab({
  keywordDescription:
    'The search phrase this page should rank for, for example docpulse whatsapp appointment booking. Used in the SEO title when that is left empty.',
  ownPage: {
    titleDescription:
      'Left empty, it is filled as "<primary keyword> with NeuronCx | NeuronCx", or the name if there is no keyword. Needed to publish with Own page on.',
    descriptionDescription: 'Left empty, it is filled from the summary. Needed to publish with Own page on.',
  },
})

export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: {
    singular: 'Integration item',
    plural: 'Integration items',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: liveOrAuthenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status', 'featured'],
    description:
      'The systems NeuronCx connects to. Each entry is written once and shown wherever integrations are listed.',
    group: 'Integrations',
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [itemFallbacks],
    afterChange: [itemRefreshCategories],
    afterDelete: [itemRefreshCategoriesAfterDelete],
  },
  fields: [
    nameField({ maxLength: 60 }),
    ...sidebar,
    {
      type: 'tabs',
      tabs: [
        cardTab,
        integrationSeoTab,
        pageTab,
        whatMovesTab,
        edgeCasesTab,
        setupTab,
        exampleTab,
        faqTab(),
        whatsapp,
        kbaseTab(),
      ],
    },
  ],
}
