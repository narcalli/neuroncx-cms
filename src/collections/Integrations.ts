import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'

/**
 * The systems NeuronCx connects to, kept in one place so every page that
 * lists integrations reads the same entries instead of its own copy.
 *
 * Drafts are on: an entry can be prepared and saved without appearing on
 * the site until it is published. Separately, the site shows only entries
 * whose status is Live.
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
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'status', 'featured'],
    description: 'The systems NeuronCx connects to. Each entry is written once and shown wherever integrations are listed.',
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
      type: 'select',
      required: true,
      options: [
        { label: 'Messaging channels', value: 'messaging' },
        { label: 'Telephony and dialers', value: 'telephony' },
        { label: 'CRM and marketing', value: 'crm-marketing' },
        { label: 'Hospital systems', value: 'hospital-systems' },
        { label: 'Payments', value: 'payments' },
        { label: 'Data and BI', value: 'data-bi' },
      ],
    },
    {
      name: 'connection',
      type: 'select',
      options: [
        { label: 'Native connector', value: 'native' },
        { label: 'API and webhooks', value: 'api-webhooks' },
        { label: 'File import', value: 'file-import' },
      ],
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
      type: 'select',
      hasMany: true,
      options: [
        { label: 'CRM', value: 'crm' },
        { label: 'Campaigns', value: 'campaigns' },
        { label: 'Call quality', value: 'call-quality' },
        { label: 'Bots', value: 'bots' },
        { label: 'Knowledge base', value: 'knowledge-base' },
        { label: 'Workflows', value: 'workflows' },
      ],
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
