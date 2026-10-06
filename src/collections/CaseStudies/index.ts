import type { CollectionConfig } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'

/**
 * Customer case studies. Each has a card summary for the directory and an
 * optional full story at /customers/[slug].
 *
 * The website hides any entry with clientPending set, unless the request is
 * a draft preview from the admin.
 */
export const CaseStudies: CollectionConfig = {
  slug: 'caseStudies',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'clientName', 'featured', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Case studies for the customer pages. Leave "Client name still to confirm" ticked until the client has approved their name.',
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Used in the address, e.g. ovum for /customers/ovum. Lowercase, dashes only.' },
    },
    { name: 'clientName', type: 'text', required: true, maxLength: 120 },
    {
      name: 'clientPending',
      type: 'checkbox',
      label: 'Client name still to confirm',
      defaultValue: false,
      admin: { description: 'Ticked hides this case study from the public site until it is cleared.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Client logo (optional)',
    },
    {
      name: 'sectors',
      type: 'relationship',
      relationTo: 'sectors',
      hasMany: true,
      label: 'Sectors',
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 240,
      admin: { description: 'One line shown on the card.' },
    },
    {
      name: 'outcomeHeadline',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'The outcome-style card title. No invented figures. Falls back to the title if empty.',
      },
    },
    {
      name: 'metrics',
      type: 'array',
      maxRows: 4,
      admin: { initCollapsed: true, description: 'Only real, confirmed figures.' },
      fields: [
        { name: 'value', type: 'text', required: true, maxLength: 20 },
        { name: 'label', type: 'text', required: true, maxLength: 80 },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor(),
      label: 'Full story',
      admin: { description: 'Shown on the case study page.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
