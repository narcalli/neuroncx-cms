import { hubFields } from '../fields/hub'
import { iconField } from '../fields/icons'
import { plainText } from '../fields/validators/plainText'
import { checklistFields } from './integrations/checklist'
import { categoryAutoRowDescription } from './integrations/hooks'
import { taxonomy, type UsedByRef } from './taxonomy'

/**
 * The editable lists an integration is tagged with: its category, its
 * connection type and the products it works with. They used to be fixed
 * options in code; as collections, editors add, rename and reorder them in
 * the admin, and every integration and block filter follows, because they
 * link to an entry instead of copying its text. Built with taxonomy().
 */

/** Integrations that link to an entry through this field. */
const integrationsUsing = (field: 'category' | 'connection' | 'products'): UsedByRef => ({
  collection: 'integrations',
  field,
  one: 'integration',
  many: 'integrations',
  show: 'name',
})

/** Page blocks whose filter includes an entry. */
const blockFiltersUsing = (field: 'categories' | 'products'): UsedByRef => ({
  collection: 'pages',
  field: `layout.${field}`,
  one: 'page',
  many: 'pages',
  show: 'slug',
  prefix: 'a block filter on',
})

export const IntegrationCategories = taxonomy({
  slug: 'integrationCategories',
  singular: 'Integration category',
  plural: 'Integration categories',
  group: 'Integrations',
  description:
    "Groups for integrations. Used in each integration's Category field and in the blocks' Categories filter.",
  usedBy: [integrationsUsing('category'), blockFiltersUsing('categories')],
  noun: 'category',
  capped: true,
  drafts: true,
  hooks: { beforeChange: [categoryAutoRowDescription] },
  fields: hubFields({
    hubHeading: 'The section heading on landing pages, for example "Where you book".',
    hubIntro:
      'One line shown under the category heading on landing pages, for example: The booking and records systems your front desk already uses.',
    icon: 'Shown with the category heading on landing pages.',
    waRowTitle: 'The category as a row in the WhatsApp menu.',
    waRowDescriptionAuto:
      "Lists the names of this category's live, published integrations, in order, cut to 70 characters on a whole name. It updates when an integration is published, changed, unpublished or deleted. Publishing an integration can therefore save this category as a new published version, so publish or discard any open draft of the category first.",
    waRowDescription:
      'Aim for 60 characters. Written for you while the automatic switch above is on.',
  }),
})

export const ConnectionTypes = taxonomy({
  slug: 'connectionTypes',
  singular: 'Integration connection type',
  plural: 'Integration connection types',
  group: 'Integrations',
  description:
    "How NeuronCx connects to an integration. Used in each integration's Connection field.",
  usedBy: [integrationsUsing('connection')],
  noun: 'connection type',
  capped: true,
  drafts: true,
  fields: [
    {
      name: 'badgeLabel',
      type: 'text',
      label: 'Badge label',
      maxLength: 20,
      admin: { description: 'The short chip shown on cards, for example Webhooks.' },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
      admin: { description: "What this means for the client's team, in plain words." },
    },
    {
      name: 'timing',
      type: 'select',
      options: [
        { label: 'As it happens', value: 'asItHappens' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'On upload', value: 'onUpload' },
      ],
      admin: { description: 'When data moves between the two systems.' },
    },
    {
      name: 'typicalSetup',
      type: 'textarea',
      label: 'Typical setup',
      maxLength: 120,
      admin: {
        description: 'Who does what to connect, for example: Your vendor adds our webhook address.',
      },
    },
    {
      name: 'defaultChecklist',
      type: 'array',
      label: 'Default setup checklist',
      labels: { singular: 'Step', plural: 'Steps' },
      admin: {
        description:
          "Copied into an integration's setup checklist when its connection is set and its checklist is empty.",
      },
      fields: checklistFields(),
    },
    {
      name: 'waLine',
      type: 'text',
      label: 'WhatsApp line',
      maxLength: 60,
      validate: plainText,
      admin: {
        description:
          'One line used inside WhatsApp messages, for example: Bookings arrive as they happen.',
      },
    },
    {
      name: 'kbAnswer',
      type: 'textarea',
      label: 'Knowledge base answer',
      maxLength: 600,
      validate: plainText,
      admin: {
        description:
          'Answers "How do you connect to our system?" for this connection type, in plain words.',
      },
    },
  ],
})

// Site-wide, not only for integrations: case studies, product pages or the
// product blocks can tag by product later from this same list.
export const Products = taxonomy({
  slug: 'products',
  singular: 'Product',
  plural: 'Products',
  description:
    'NeuronCx products. Integrations tag the products they work with; other parts of the site can use the same list later.',
  usedBy: [integrationsUsing('products'), blockFiltersUsing('products')],
  noun: 'product',
  fields: [
    {
      name: 'shortDescription',
      type: 'text',
      maxLength: 160,
      label: 'Short description (one line)',
    },
    iconField(undefined, { label: 'Icon (optional)' }),
  ],
})
