import type { CollectionBeforeDeleteHook, CollectionConfig, Field, Where } from 'payload'
import { APIError } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { iconField } from '../fields/icons'

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

const baseFields: Field[] = [
  { name: 'name', type: 'text', required: true, unique: true },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      description: 'A short fixed code for addresses and filters. Filled in from the name if left empty. Lowercase, dashes only.',
    },
    hooks: {
      beforeValidate: [({ value, data }) => value || (data?.name ? slugify(String(data.name)) : value)],
    },
    validate: (value: unknown) =>
      typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
        ? true
        : 'Lowercase letters, numbers and single dashes only, for example hospital-systems.',
  },
  {
    name: 'order',
    type: 'number',
    defaultValue: 100,
    admin: { description: 'Lower numbers come first in dropdowns and lists.' },
  },
]

/** Where each list is referenced, so an entry in use cannot be deleted. */
type UsedBy = { integrationField: 'category' | 'connection' | 'products'; blockField?: 'categories' | 'products' }

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
      uses.push(`${integrations.totalDocs} integration${integrations.totalDocs === 1 ? '' : 's'} (${names}${integrations.totalDocs > 5 ? ', ...' : ''})`)
    }
    if (pages?.totalDocs) {
      const slugs = pages.docs.map((d) => d.slug).join(', ')
      uses.push(`a block filter on ${pages.totalDocs} page${pages.totalDocs === 1 ? '' : 's'} (${slugs}${pages.totalDocs > 5 ? ', ...' : ''})`)
    }
    if (uses.length) {
      throw new APIError(`This ${noun} is still used by ${uses.join(' and ')}. Move them to another ${noun} first.`, 400, null, true)
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
}): CollectionConfig => ({
  slug: opts.slug,
  labels: { singular: opts.singular, plural: opts.plural },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    description: opts.description,
    ...(opts.group ? { group: opts.group } : {}),
  },
  defaultSort: 'order',
  hooks: { beforeDelete: [refuseDeleteWhileUsed(opts.usedBy, opts.noun)] },
  fields: [...baseFields, ...(opts.fields || [])],
})

export const IntegrationCategories = taxonomy({
  slug: 'integrationCategories',
  singular: 'Integration Category',
  plural: 'Integration Categories',
  group: 'Integrations',
  description: "Groups for integrations. Used in each integration's Category field and in the blocks' Categories filter.",
  usedBy: { integrationField: 'category', blockField: 'categories' },
  noun: 'category',
  fields: [
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional. For example an intro line if the integrations page groups entries by category.' },
    },
  ],
})

export const ConnectionTypes = taxonomy({
  slug: 'connectionTypes',
  singular: 'Connection Type',
  plural: 'Connection Types',
  group: 'Integrations',
  description: 'How NeuronCx connects to an integration. Used in each integration\'s Connection field.',
  usedBy: { integrationField: 'connection' },
  noun: 'connection type',
  fields: [
    {
      name: 'description',
      type: 'text',
      admin: { description: 'Optional. One line, for example: Built-in connector, no setup on your side.' },
    },
  ],
})

// Site-wide, not only for integrations: case studies, product pages or the
// product blocks can tag by product later from this same list.
export const Products = taxonomy({
  slug: 'products',
  singular: 'Product',
  plural: 'Products',
  description: 'NeuronCx products. Integrations tag the products they work with; other parts of the site can use the same list later.',
  usedBy: { integrationField: 'products', blockField: 'products' },
  noun: 'product',
  group: 'Integrations',
  fields: [
    { name: 'shortDescription', type: 'text', maxLength: 160, label: 'Short description (one line)' },
    iconField(undefined, { label: 'Icon (optional)' }),
  ],
})
