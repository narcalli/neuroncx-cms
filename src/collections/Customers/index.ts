import type {
  Access,
  CollectionAfterReadHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Validate,
  Where,
} from 'payload'
import { checkbox as validateCheckbox, text as validateText } from 'payload/shared'

import { authenticated } from '../../access/authenticated'
import { storyLexical } from '../../fields/storyLexical'

/**
 * Customers, with an optional case study page of their own at
 * /customers/[slug]. Replaces the old caseStudies collection.
 *
 * One switch, "Show real name", decides what the public sees. It is enforced
 * here, not only on the website: with it off, a visitor (or anyone reading
 * the public REST or GraphQL API) gets the anonymised name and none of the
 * identifying details. See stripForVisitors below.
 */

const ownPageRule: Validate = (value, options) => {
  const builtIn = validateCheckbox(value, options as any)
  if (builtIn !== true) return builtIn
  const data = options.data as { showName?: boolean; heroHeading?: string } | undefined
  if (value && (!data?.showName || !data?.heroHeading)) {
    return 'Turn on Show real name and add a hero heading before giving this customer its own page.'
  }
  return true
}

const slugRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  return typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Lowercase letters, numbers and single dashes only, for example ovum-hospitals.'
}

// The Story tab's fields only appear for a customer with its own page.
const whenOwnPage = { condition: (data: { hasOwnPage?: boolean }) => Boolean(data?.hasOwnPage) }

// Logged-in users see everything. Visitors see published customers that are
// not marked past.
const publishedAndCurrent: Access = ({ req: { user } }) => {
  if (user) return true
  const where: Where = {
    and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'past' } }],
  }
  return where
}

/**
 * What a visitor receives. Runs on every read without a logged-in user over
 * the REST or GraphQL API, including when a customer is pulled into a page
 * through a block. The Local API (server-side scripts and jobs) gets the
 * document as saved, so a script that reads and writes back cannot lose
 * data; anything that publishes from the Local API must strip it itself.
 */
export const stripForVisitors = (input: Record<string, any>) => {
  const doc: Record<string, any> = { ...input }
  const drop = (...keys: string[]) => keys.forEach((k) => delete doc[k])

  if (!doc.showName) {
    doc.name = doc.anonymisedName
    doc.slug = null
    doc.hasOwnPage = false
    // description ("About the organisation") is dropped too: it would name
    // the organisation even with the name hidden.
    drop('image', 'quotes', 'results', 'locations', 'city', 'description', 'heroHeading', 'heroSubheading', 'challenge', 'approach', 'storySections')
  }

  drop('anonymisedName', 'showName')
  return doc
}

const realNameForVisitors: CollectionAfterReadHook = ({ doc, req }) => {
  if (req.user || req.payloadAPI === 'local') return doc
  return stripForVisitors(doc)
}

// Fields a visitor may not search or sort by while they are hidden. Without
// this, /api/customers?where[name][like]=Ovum would return the anonymised
// entry and so confirm that a client called Ovum exists.
const PROTECTED = new Set([
  'name', 'slug', 'anonymisedName', 'showName', 'city', 'locations', 'description', 'image',
  'quotes', 'results', 'heroHeading', 'heroSubheading', 'challenge', 'approach', 'storySections',
])
const touchesProtected = (where: unknown): boolean => {
  if (!where || typeof where !== 'object') return false
  return Object.entries(where as Record<string, unknown>).some(([key, value]) =>
    key === 'and' || key === 'or'
      ? Array.isArray(value) && value.some(touchesProtected)
      : PROTECTED.has(key.split('.')[0]),
  )
}

// For visitors: a search on a hidden field only matches customers with Show
// real name on, and sorting by a hidden field is ignored.
const noInferenceForVisitors: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (req.user || req.payloadAPI === 'local' || (operation !== 'read' && operation !== 'count')) return args
  // A lookup by id has neither where nor sort; a list or count may have both.
  const a = args as { where?: Where; sort?: string | string[] }
  if (a.where && touchesProtected(a.where)) {
    a.where = { and: [a.where, { showName: { equals: true } }] }
  }
  if (a.sort) {
    const keys = (Array.isArray(a.sort) ? a.sort : String(a.sort).split(','))
      .map((k) => k.trim())
      .filter((k) => k && !PROTECTED.has(k.replace(/^-/, '').split('.')[0]))
    a.sort = keys.length ? keys : 'order'
  }
  return args
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedAndCurrent,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'showName', 'featured', 'updatedAt'],
    group: 'Customers',
    description:
      "Customers and their case studies. A customer's real name, logo, quotes and figures only reach the public site when Show real name is on.",
  },
  defaultSort: 'order',
  hooks: { beforeOperation: [noInferenceForVisitors], afterRead: [realNameForVisitors] },
  versions: {
    drafts: {
      schedulePublish: true,
    },
  },
  fields: [
    // Sidebar
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: slugRule,
      admin: { position: 'sidebar', description: 'Used in the address, e.g. ovum for /customers/ovum.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pilot', value: 'pilot' },
        { label: 'Past', value: 'past' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'showName',
      type: 'checkbox',
      label: 'Show real name',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Turn on only when the client has agreed to be named.' },
    },
    {
      name: 'sectors',
      type: 'relationship',
      relationTo: 'sectors',
      hasMany: true,
      admin: { position: 'sidebar', sortOptions: 'order' },
    },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower shows first.' },
    },
    {
      name: 'hasOwnPage',
      type: 'checkbox',
      label: 'Own page',
      defaultValue: false,
      validate: ownPageRule,
      admin: {
        position: 'sidebar',
        description: 'Gives this customer its own page. Only allowed when Show real name is on.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Card',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              unique: true,
              maxLength: 120,
              admin: { description: "The client's real name." },
            },
            {
              name: 'anonymisedName',
              type: 'text',
              required: true,
              maxLength: 80,
              admin: {
                description:
                  'Shown wherever the name is not cleared. Describe type and scale, not identity, for example: A multi-specialty hospital chain in South India.',
              },
            },
            { name: 'tagline', type: 'text', maxLength: 60 },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              maxLength: 140,
              admin: { description: 'One line on what changed for them. Aim for 120 characters.' },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo',
              admin: { description: 'Transparent PNG or SVG.' },
            },
            { name: 'logoScale', type: 'number', min: 50, max: 200, defaultValue: 100 },
          ],
        },
        {
          label: 'Profile',
          fields: [
            { name: 'description', type: 'richText', label: 'About the organisation', editor: storyLexical },
            { name: 'city', type: 'text', maxLength: 60 },
            {
              name: 'locations',
              type: 'number',
              admin: { description: 'Number of sites. Hidden when Show real name is off.' },
            },
            { name: 'since', type: 'date' },
            { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { sortOptions: 'order' } },
            { name: 'integrations', type: 'relationship', relationTo: 'integrations', hasMany: true, admin: { sortOptions: 'order' } },
          ],
        },
        {
          label: 'Story',
          description: 'Only used when "Own page" is ticked in the sidebar.',
          fields: [
            { name: 'heroHeading', type: 'text', maxLength: 70, admin: whenOwnPage },
            { name: 'heroSubheading', type: 'textarea', maxLength: 200, admin: whenOwnPage },
            { name: 'challenge', type: 'richText', editor: storyLexical, admin: whenOwnPage },
            { name: 'approach', type: 'richText', editor: storyLexical, admin: whenOwnPage },
            {
              name: 'results',
              type: 'array',
              maxRows: 4,
              admin: whenOwnPage,
              fields: [
                { name: 'metric', type: 'text', required: true, maxLength: 80 },
                { name: 'value', type: 'text', required: true, maxLength: 20 },
                { name: 'baseline', type: 'text', maxLength: 40 },
                { name: 'period', type: 'text', maxLength: 40 },
                { name: 'source', type: 'text', maxLength: 120 },
              ],
            },
            {
              name: 'storySections',
              type: 'array',
              admin: whenOwnPage,
              fields: [
                { name: 'product', type: 'relationship', relationTo: 'products', admin: { sortOptions: 'order' } },
                { name: 'heading', type: 'text', maxLength: 90 },
                { name: 'body', type: 'richText', editor: storyLexical },
              ],
            },
            {
              name: 'quotes',
              type: 'array',
              admin: whenOwnPage,
              fields: [
                { name: 'quote', type: 'textarea', required: true, maxLength: 400 },
                { name: 'person', type: 'text', required: true, maxLength: 80 },
                { name: 'role', type: 'text', maxLength: 100 },
              ],
            },
          ],
        },
      ],
    },
  ],
}
