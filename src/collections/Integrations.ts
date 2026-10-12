import type { Access, CollectionConfig, Where } from 'payload'

import { authenticated } from '../access/authenticated'

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
 * The systems NeuronCx connects to, kept in one place so every page that
 * lists integrations reads the same entries instead of its own copy.
 *
 * Drafts are on: an entry can be prepared and saved without appearing on
 * the site until it is published. Visitors also never see an entry whose
 * status is not Live; see liveOrAuthenticated above.
 *
 * Category, connection and products link to their own collections
 * (IntegrationTaxonomies.ts), so editors manage those lists in the admin.
 */
export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: {
    singular: 'Integration',
    plural: 'Integrations',
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
    description: 'The systems NeuronCx connects to. Each entry is written once and shown wherever integrations are listed.',
    group: 'Integrations',
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Transparent PNG or SVG. Leave empty to show the name only.',
      },
    },
    {
      name: 'summary',
      type: 'text',
      maxLength: 120,
      admin: {
        description: 'What flows between the two systems, in plain words.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'integrationCategories',
      required: true,
      admin: { sortOptions: 'order' },
    },
    {
      name: 'connection',
      type: 'relationship',
      relationTo: 'connectionTypes',
      admin: { sortOptions: 'order' },
    },
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
      admin: {
        description: 'Only Live integrations show on the public site.',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { sortOptions: 'order' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Tick to include in the short list on the home page.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: {
        description: 'Lower numbers show first.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Only needed if this integration gets its own page later.',
      },
    },
  ],
}
