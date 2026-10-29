import type { Access, CollectionConfig, Field, Where } from 'payload'

import { authenticated } from '../access/authenticated'
import { itemCardDesignField } from '../fields/cardDesign'
import { faqTab } from '../fields/faq'
import { kbaseTab } from '../fields/kbase'
import { link } from '../fields/link'
import { plainText } from '../fields/validators/plainText'
import { whatsappTab } from '../fields/whatsapp'
import { VERTICAL_OPTIONS } from '../fields/verticals'
import { checklistFields } from './integrations/checklist'
import { revalidateIndustriesForIntegration } from './integrations/revalidateIndustries'
import {
  itemFallbacks,
  itemRefreshCategories,
  itemRefreshCategoriesAfterDelete,
  itemSlugRule,
  requiredForOwnPage,
} from './integrations/hooks'
import { integrationSeoTab, seoCheckField } from './integrations/seo'
import { revalidateOnSite, revalidateOnSiteAfterDelete } from '../hooks/revalidateOnSite'

// The integration's page and the integrations page, on the website.
const integrationPaths = (d: { slug?: string | null }) => [d.slug ? `/integrations/${d.slug}` : null, '/integrations']

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

const ownPageOn = (data: Record<string, unknown> | undefined) => Boolean(data?.hasOwnPage)

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
 */

// Sidebar: the existing tagging fields, the slug and the own page switch.
const sidebar: Field[] = [
  {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue: 'live',
    options: [
      { label: 'Live', value: 'live' },
      { label: 'Pilot', value: 'pilot' },
      { label: 'Planned', value: 'planned' },
    ],
    admin: { position: 'sidebar', description: 'Only Live integrations show on the public site.' },
  },
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
  {
    // The same list as an agent's and an industry's Verticals
    // (fields/verticals.ts): industry pages list the integrations for theirs.
    name: 'verticals',
    type: 'select',
    label: 'Verticals',
    hasMany: true,
    options: [...VERTICAL_OPTIONS],
    admin: { position: 'sidebar', description: 'The industries this integration is used in.' },
  },
  {
    name: 'featured',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: 'Tick to include in the short list on the home page.',
    },
  },
  {
    name: 'order',
    type: 'number',
    defaultValue: 100,
    admin: { position: 'sidebar', description: 'Lower numbers show first.' },
  },
  {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    maxLength: 60,
    validate: itemSlugRule,
    admin: {
      position: 'sidebar',
      description: 'Used in the address /integrations/<slug>. Needed to publish with Own page on.',
    },
  },
  {
    name: 'hasOwnPage',
    type: 'checkbox',
    label: 'Own page',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description:
        'Gives this integration a page at /integrations/<slug>. The Page tab appears while this is on. Publishing then needs a slug, a hero heading and an SEO title and description.',
    },
  },
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

const cardTab = {
  label: 'Card',
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Transparent PNG or SVG. Leave empty to show the name only.' },
    },
    {
      name: 'tagline',
      type: 'text',
      maxLength: 60,
      admin: { description: 'A short line under the name. Aim for 45 characters.' },
    },
    {
      name: 'summary',
      type: 'text',
      maxLength: 120,
      admin: { description: 'What flows between the two systems, in plain words.' },
    },
    // Optional, no default: empty uses the category's design, else the section's.
    itemCardDesignField({
      clearLabel: 'Follow the category',
      description:
        "Leave empty to use the category's design, or the section's when the category has none. Used only where the section allows it.",
    }),
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
  ] as Field[],
}

const headingOverride = (name: string, label: string): Field => ({
  name,
  type: 'text',
  label,
  maxLength: 70,
})

const pageTab = {
  label: 'Page',
  admin: { condition: (data: Record<string, unknown>) => ownPageOn(data) },
  fields: [
    {
      name: 'heroHeading',
      type: 'text',
      label: 'Hero heading',
      maxLength: 70,
      validate: requiredForOwnPage('a hero heading'),
      admin: {
        description:
          'An action, the partner name and the result, for example: Book DocPulse appointments on WhatsApp. Needed to publish with Own page on.',
      },
    },
    {
      name: 'heroSubheading',
      type: 'textarea',
      label: 'Hero subheading',
      maxLength: 200,
      admin: { description: 'Who does what, and what lands where, in two sentences.' },
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to action',
      admin: { description: 'The closing button. Type a label to choose where it goes.' },
      fields: [
        { name: 'label', type: 'text', maxLength: 30 },
        // Shown, and required, only once there is a label.
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            admin: { condition: (_: unknown, siblingData: any) => Boolean(siblingData?.label) },
          },
        }),
      ],
    },
    {
      name: 'showClosing',
      type: 'checkbox',
      label: 'Show closing panel',
      defaultValue: true,
      admin: {
        description:
          'The dark panel at the end of the page, with the heading and text from the main integrations master record. Off leaves it out on this page only.',
      },
    },
    {
      name: 'related',
      type: 'relationship',
      relationTo: 'integrations',
      hasMany: true,
      maxRows: 3,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        description: 'Up to 3. Leave empty to show other live integrations in the same category.',
      },
    },
    {
      name: 'headingOverrides',
      type: 'group',
      label: 'Section headings',
      admin: {
        description: 'Leave empty to use the headings from the main integrations master record.',
      },
      fields: [
        headingOverride('statusTable', 'Status table'),
        headingOverride('edgeCases', 'Edge cases'),
        headingOverride('setup', 'Setup'),
        headingOverride('related', 'Related'),
      ],
    },
  ] as Field[],
}

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
    afterChange: [itemRefreshCategories, revalidateIndustriesForIntegration, revalidateOnSite('integrations', integrationPaths)],
    afterDelete: [itemRefreshCategoriesAfterDelete, revalidateOnSiteAfterDelete('integrations', integrationPaths)],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 60,
    },
    ...sidebar,
    {
      type: 'tabs',
      tabs: [
        cardTab,
        integrationSeoTab({ forItems: true }),
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
