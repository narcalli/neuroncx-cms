import type {
  CollectionBeforeDeleteHook,
  CollectionConfig,
  Field,
  Validate,
  Where,
} from 'payload'
import { APIError } from 'payload'
import { text as validateText } from 'payload/shared'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { publishedOrBeforeDrafts } from '../access/publishedOrBeforeDrafts'
import { itemCardDesignField } from '../fields/cardDesign'
import { iconField } from '../fields/icons'
import { plainText } from '../fields/validators/plainText'
import { checklistFields } from './integrations/checklist'
import { categoryAutoRowDescription } from './integrations/hooks'
import { revalidateOnSite } from '../hooks/revalidateOnSite'

/**
 * The editable lists an integration is tagged with: its category, its
 * connection type and the products it works with. They used to be fixed
 * options in code; as collections, editors add, rename and reorder them in
 * the admin, and every integration and block filter follows, because they
 * link to an entry instead of copying its text.
 */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slugFormat = (value: unknown) =>
  typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Lowercase letters, numbers and single dashes only, for example hospital-systems.'

// With caps, the built-in text check runs first so maxLength holds. Without,
// the slug check stays exactly as it was (Products).
const slugRule =
  (capped: boolean): Validate =>
  (value, options) => {
    if (capped) {
      const builtIn = validateText(value, options as any)
      if (builtIn !== true) return builtIn
    }
    return slugFormat(value)
  }

const baseFields = (capped: boolean): Field[] => [
  {
    name: 'name',
    type: 'text',
    required: true,
    unique: true,
    ...(capped ? { maxLength: 60 } : {}),
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    ...(capped ? { maxLength: 60 } : {}),
    admin: {
      description:
        'A short fixed code for addresses and filters. Filled in from the name if left empty. Lowercase, dashes only.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => value || (data?.name ? slugify(String(data.name)) : value),
      ],
    },
    validate: slugRule(capped),
  },
  {
    name: 'order',
    type: 'number',
    defaultValue: 100,
    admin: { description: 'Lower numbers come first in dropdowns and lists.' },
  },
]

/** Where each list is referenced, so an entry in use cannot be deleted. */
type UsedBy = {
  integrationField: 'category' | 'connection' | 'products'
  blockField?: 'categories' | 'products'
}

// Refuses to delete an entry that an integration or a page block still
// points at, and names them, rather than leaving those integrations without a
// category or a block filter quietly showing fewer entries. Drafts count too.
const refuseDeleteWhileUsed =
  (usedBy: UsedBy, noun: string): CollectionBeforeDeleteHook =>
  async ({ id, req }) => {
    const ref = (path: string): Where => ({ [path]: { in: [id] } })
    const integrations = await req.payload.find({
      collection: 'integrations',
      where: ref(usedBy.integrationField),
      draft: true,
      depth: 0,
      limit: 5,
      overrideAccess: true,
      req,
    })
    const pages = usedBy.blockField
      ? await req.payload.find({
          collection: 'pages',
          where: ref(`layout.${usedBy.blockField}`),
          draft: true,
          depth: 0,
          limit: 5,
          overrideAccess: true,
          req,
        })
      : null

    const uses: string[] = []
    if (integrations.totalDocs) {
      const names = integrations.docs.map((d) => d.name).join(', ')
      uses.push(
        `${integrations.totalDocs} integration${integrations.totalDocs === 1 ? '' : 's'} (${names}${integrations.totalDocs > 5 ? ', ...' : ''})`,
      )
    }
    if (pages?.totalDocs) {
      const slugs = pages.docs.map((d) => d.slug).join(', ')
      uses.push(
        `a block filter on ${pages.totalDocs} page${pages.totalDocs === 1 ? '' : 's'} (${slugs}${pages.totalDocs > 5 ? ', ...' : ''})`,
      )
    }
    if (uses.length) {
      throw new APIError(
        `This ${noun} is still used by ${uses.join(' and ')}. Move them to another ${noun} first.`,
        400,
        null,
        true,
      )
    }
  }

const taxonomy = (opts: {
  slug: string
  singular: string
  plural: string
  description: string
  group?: string
  usedBy: UsedBy
  noun: string
  fields?: Field[]
  /** Caps name and slug at 60 characters. */
  capped?: boolean
  /** Drafts on, no autosave, with publishedOrBeforeDrafts read access. */
  drafts?: boolean
  hooks?: CollectionConfig['hooks']
}): CollectionConfig => ({
  slug: opts.slug,
  labels: { singular: opts.singular, plural: opts.plural },
  access: {
    create: authenticated,
    delete: authenticated,
    read: opts.drafts ? publishedOrBeforeDrafts : anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    description: opts.description,
    ...(opts.group ? { group: opts.group } : {}),
  },
  defaultSort: 'order',
  hooks: {
    ...opts.hooks,
    beforeDelete: [refuseDeleteWhileUsed(opts.usedBy, opts.noun)],
    // Integrations show these by name, on their pages and in the lists.
    afterChange: [...(opts.hooks?.afterChange ?? []), revalidateOnSite(opts.slug, () => ['/integrations'])],
  },
  ...(opts.drafts ? { versions: { drafts: true } } : {}),
  fields: [...baseFields(Boolean(opts.capped)), ...(opts.fields || [])],
})

export const IntegrationCategories = taxonomy({
  slug: 'integrationCategories',
  singular: 'Integration category',
  plural: 'Integration categories',
  group: 'Integrations',
  description:
    "Groups for integrations. Used in each integration's Category field and in the blocks' Categories filter.",
  usedBy: { integrationField: 'category', blockField: 'categories' },
  noun: 'category',
  capped: true,
  drafts: true,
  hooks: { beforeChange: [categoryAutoRowDescription] },
  fields: [
    {
      name: 'hubHeading',
      type: 'text',
      label: 'Hub heading',
      maxLength: 60,
      admin: {
        description: 'The section heading on landing pages, for example "Where you book".',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Hub intro',
      maxLength: 140,
      admin: {
        description:
          'One line shown under the category heading on landing pages, for example: The booking and records systems your front desk already uses.',
      },
    },
    iconField(undefined, { description: 'Shown with the category heading on landing pages.' }),
    // Optional, no default: empty follows the section's design.
    itemCardDesignField({
      clearLabel: 'Follow the section',
      description:
        'Every integration in this category uses it, unless the integration has its own. Leave empty to follow the section. Used only where the section allows it.',
    }),
    {
      name: 'waRowTitle',
      type: 'text',
      label: 'WhatsApp row title',
      maxLength: 24,
      validate: plainText,
      admin: { description: 'The category as a row in the WhatsApp menu.' },
    },
    {
      name: 'waRowDescriptionAuto',
      type: 'checkbox',
      label: 'Fill the WhatsApp row description automatically',
      defaultValue: false,
      admin: {
        description:
          "Lists the names of this category's live, published integrations, in order, cut to 70 characters on a whole name. It updates when an integration is published, changed, unpublished or deleted. Publishing an integration can therefore save this category as a new published version, so publish or discard any open draft of the category first.",
      },
    },
    {
      name: 'waRowDescription',
      type: 'text',
      label: 'WhatsApp row description',
      maxLength: 70,
      validate: plainText,
      admin: {
        description:
          'Aim for 60 characters. Written for you while the automatic switch above is on.',
      },
    },
  ],
})

export const ConnectionTypes = taxonomy({
  slug: 'connectionTypes',
  singular: 'Integration connection type',
  plural: 'Integration connection types',
  group: 'Integrations',
  description:
    "How NeuronCx connects to an integration. Used in each integration's Connection field.",
  usedBy: { integrationField: 'connection' },
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
  usedBy: { integrationField: 'products', blockField: 'products' },
  noun: 'product',
  group: 'Integrations',
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
