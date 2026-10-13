import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '../../access/authenticated'
import { publicLiveOrPilot } from '../../access/publicLiveOrPilot'
import {
  cardTab,
  coreFields,
  detailTab,
  faqTab,
  kbaseTab,
  ownPage,
  seoTab,
  statusField,
  whatsappTab,
} from '../../fields/shared'

/**
 * B2C CRM: one entry per capability of the NeuronCx CRM, such as Customer
 * 360 or Campaigns. Spec: docs/cms/collections/b2c_crm.md, sections 3 and 4,
 * built from the shared groups in docs/cms/fields_reference.md.
 *
 * Visitors and the public API see published Live and Pilot entries only
 * (publicLiveOrPilot). The spec's "beta" is the shared status's Pilot.
 * Not yet watched by the knowledge base, and the website has no route for
 * it yet; both are later steps.
 */

const page = ownPage('crmFeatures')
const card = cardTab()
const detail = detailTab()

// Fields only this collection has.
const sidebarFields: Field[] = [
  {
    name: 'area',
    type: 'relationship',
    relationTo: 'lists',
    required: true,
    filterOptions: { type: { equals: 'crmArea' } },
    admin: {
      position: 'sidebar',
      sortOptions: 'order',
      description: 'Groups features on the CRM hub page and in WhatsApp menus.',
    },
  },
  {
    name: 'problemSolved',
    type: 'select',
    label: 'Problem it solves',
    hasMany: true,
    options: [
      { label: 'The follow-up that looks like a stranger', value: 'strangerFollowUp' },
      { label: 'The customer who quietly drops off', value: 'silentDropOff' },
      { label: 'One customer, many records', value: 'duplicateRecords' },
    ],
    admin: {
      position: 'sidebar',
      description: 'Which of the three home page problems this answers. Optional.',
    },
  },
]

const legacyGap: Field = {
  name: 'legacyGap',
  type: 'text',
  label: 'Legacy gap',
  maxLength: 160,
  admin: {
    description: 'One line on how a sales-pipeline CRM handles this. Never name a competitor.',
  },
}

const pageFields: Field[] = [
  {
    name: 'screenshots',
    type: 'array',
    labels: { singular: 'Screenshot', plural: 'Screenshots' },
    maxRows: 3,
    admin: { description: 'Demo-tenant screenshots only.', initCollapsed: true },
    fields: [
      { name: 'image', type: 'upload', relationTo: 'media', required: true },
      { name: 'alt', type: 'text', label: 'Alt text', required: true, maxLength: 160 },
    ],
  },
  {
    name: 'integrations',
    type: 'relationship',
    label: 'Works with',
    relationTo: 'integrations',
    hasMany: true,
    admin: { sortOptions: 'order' },
  },
  {
    name: 'customers',
    type: 'relationship',
    label: 'Used by',
    relationTo: 'customers',
    hasMany: true,
    admin: {
      sortOptions: 'order',
      description:
        'Visitors see each customer as the customers collection allows: real names only where Show real name is on.',
    },
  },
]

export const CrmFeatures: CollectionConfig = {
  slug: 'crmFeatures',
  labels: { singular: 'CRM feature', plural: 'B2C CRM' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publicLiveOrPilot,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Platform',
    defaultColumns: ['name', 'area', 'status', 'hasOwnPage', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    description:
      'Capabilities of the NeuronCx CRM, such as Customer 360. Only Live and Pilot entries reach the website, WhatsApp and the knowledge base.',
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
  },
  fields: [
    ...coreFields(),
    statusField(),
    page.sidebar,
    ...sidebarFields,
    {
      type: 'tabs',
      tabs: [
        card,
        { ...detail, fields: [...detail.fields, legacyGap] },
        { ...page.tab, fields: [...page.tab.fields, ...pageFields] },
        faqTab(),
        whatsappTab(),
        kbaseTab(),
        seoTab(),
      ],
    },
  ],
}
