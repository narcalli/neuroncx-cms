import type {
  Access,
  CollectionAfterReadHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Field,
  Validate,
  Where,
} from 'payload'
import { checkbox as validateCheckbox, date as validateDate, text as validateText } from 'payload/shared'

import { authenticated } from '../../access/authenticated'

/**
 * Customers, with an optional case study page of their own at
 * /customers/[slug]. Replaces the old caseStudies collection.
 *
 * Clearance is enforced here, not only on the website: a visitor (or anyone
 * reading the public REST or GraphQL API) never receives a name, logo,
 * quote or figure that has not been cleared. See stripForVisitors below.
 */

const clearanceOptions = [
  { label: 'Cleared', value: 'cleared' },
  { label: 'Pending', value: 'pending' },
  { label: 'Not allowed', value: 'notAllowed' },
]

const clearanceSelect = (name: string, label: string): Field => ({
  name,
  type: 'select',
  label,
  required: true,
  defaultValue: 'pending',
  options: clearanceOptions,
})

type Clearance = { name?: string; logo?: string; quotes?: string; figures?: string }
const anyCleared = (c?: Clearance | null) =>
  Boolean(c) && ['name', 'logo', 'quotes', 'figures'].some((k) => c?.[k as keyof Clearance] === 'cleared')

// approvedBy and approvedOn are required once anything is cleared. The
// built-in check still runs first, so maxLength and date format still apply.
const requiredWhenCleared =
  (base: Validate, message: string): Validate =>
  (value, options) => {
    const builtIn = base(value, options)
    if (builtIn !== true) return builtIn
    return anyCleared(options.siblingData as Clearance) && !value ? message : true
  }

const ownPageRule: Validate = (value, options) => {
  const builtIn = validateCheckbox(value, options as any)
  if (builtIn !== true) return builtIn
  const data = options.data as { clearance?: Clearance; heroHeading?: string } | undefined
  if (value && (data?.clearance?.name !== 'cleared' || !data?.heroHeading)) {
    return "Clear the client's name and add a hero heading before giving this customer its own page."
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
  const c: Clearance = doc.clearance || {}
  const drop = (...keys: string[]) => keys.forEach((k) => delete doc[k])

  if (c.name !== 'cleared') {
    doc.name = doc.anonymisedName
    doc.slug = null
    doc.hasOwnPage = false
    // description ("About the organisation") is dropped too: it would name
    // the organisation even with the name hidden.
    drop('image', 'quotes', 'results', 'locations', 'city', 'description', 'heroHeading', 'heroSubheading', 'challenge', 'approach', 'storySections')
  }
  if (c.logo !== 'cleared') drop('image')
  if (c.quotes !== 'cleared') drop('quotes')
  else if (Array.isArray(doc.quotes)) doc.quotes = doc.quotes.filter((q: any) => q?.cleared)
  if (c.figures !== 'cleared') drop('results', 'locations')
  else if (Array.isArray(doc.results)) doc.results = doc.results.filter((r: any) => r?.verified)

  drop('clearance', 'anonymisedName')
  return doc
}

const clearanceForVisitors: CollectionAfterReadHook = ({ doc, req }) => {
  if (req.user || req.payloadAPI === 'local') return doc
  return stripForVisitors(doc)
}

// Fields a visitor may not search or sort by while they are hidden. Without
// this, /api/customers?where[name][like]=Ovum would return the anonymised
// entry and so confirm that a client called Ovum exists.
const PROTECTED = new Set([
  'name', 'slug', 'anonymisedName', 'clearance', 'city', 'locations', 'description', 'image',
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

// For visitors: a search on a hidden field only matches customers whose name
// is cleared, and sorting by a hidden field is ignored.
const noInferenceForVisitors: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (req.user || req.payloadAPI === 'local' || (operation !== 'read' && operation !== 'count')) return args
  // A lookup by id has neither where nor sort; a list or count may have both.
  const a = args as { where?: Where; sort?: string | string[] }
  if (a.where && touchesProtected(a.where)) {
    a.where = { and: [a.where, { 'clearance.name': { equals: 'cleared' } }] }
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
    defaultColumns: ['name', 'status', 'featured', 'updatedAt'],
    group: 'Customers',
    description:
      "Customers and their case studies. A customer's real name, logo, quotes and figures only reach the public site once cleared on the Clearance tab.",
  },
  defaultSort: 'order',
  hooks: { beforeOperation: [noInferenceForVisitors], afterRead: [clearanceForVisitors] },
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
        description: 'Gives this customer its own page. Only allowed when the name is cleared.',
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
            { name: 'description', type: 'richText', label: 'About the organisation' },
            { name: 'city', type: 'text', maxLength: 60 },
            {
              name: 'locations',
              type: 'number',
              admin: { description: 'Number of sites. Hidden unless figures are cleared.' },
            },
            { name: 'since', type: 'date' },
            { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { sortOptions: 'order' } },
            { name: 'integrations', type: 'relationship', relationTo: 'integrations', hasMany: true, admin: { sortOptions: 'order' } },
          ],
        },
        {
          label: 'Clearance',
          fields: [
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
            {
              name: 'clearance',
              type: 'group',
              fields: [
                clearanceSelect('name', 'Name'),
                clearanceSelect('logo', 'Logo'),
                clearanceSelect('quotes', 'Quotes'),
                clearanceSelect('figures', 'Figures'),
                {
                  name: 'approvedBy',
                  type: 'text',
                  maxLength: 80,
                  validate: requiredWhenCleared(validateText as Validate, 'Add who approved this. Required once anything is cleared.'),
                },
                {
                  name: 'approvedOn',
                  type: 'date',
                  validate: requiredWhenCleared(validateDate as Validate, 'Add the approval date. Required once anything is cleared.'),
                },
                {
                  name: 'evidence',
                  type: 'text',
                  maxLength: 200,
                  admin: {
                    description:
                      'Where the approval is kept, for example: Email from Ovum marketing, 2 Oct 2026. Never paste the email.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Story',
          description: 'Only used when "Own page" is ticked in the sidebar.',
          fields: [
            { name: 'heroHeading', type: 'text', maxLength: 70, admin: whenOwnPage },
            { name: 'heroSubheading', type: 'textarea', maxLength: 200, admin: whenOwnPage },
            { name: 'challenge', type: 'richText', admin: whenOwnPage },
            { name: 'approach', type: 'richText', admin: whenOwnPage },
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
                { name: 'verified', type: 'checkbox', defaultValue: false },
              ],
            },
            {
              name: 'storySections',
              type: 'array',
              admin: whenOwnPage,
              fields: [
                { name: 'product', type: 'relationship', relationTo: 'products', admin: { sortOptions: 'order' } },
                { name: 'heading', type: 'text', maxLength: 90 },
                { name: 'body', type: 'richText' },
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
                { name: 'cleared', type: 'checkbox', defaultValue: false },
              ],
            },
          ],
        },
      ],
    },
  ],
}
