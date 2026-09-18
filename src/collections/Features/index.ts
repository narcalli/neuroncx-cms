import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'

export const Features: CollectionConfig = {
  slug: 'features',
  labels: {
    singular: 'Feature',
    plural: 'Features',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
 
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'order', 'updatedAt'],
    description:
      'Short product capability descriptions. These appear in the sections on the home page and on the platform pages.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description:
          'The name of the capability, as a reader would say it. Keep it under 60 characters.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'omnichannel-cx',
      options: [
        { label: 'Omnichannel CX', value: 'omnichannel-cx' },
        { label: 'Knowledge base', value: 'knowledge-base' },
        { label: 'User intelligence', value: 'user-intelligence' },
        { label: 'Integrations', value: 'integrations' },
      ],
      admin: {
        description:
          'Which part of the platform this belongs to. Decides where it appears on the site.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: {
        description:
          'One or two plain sentences describing what this does for the customer. Shown in listings and on the home page.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        description: 'Optional longer explanation, shown on the feature page itself.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional illustration. Landscape images work best.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first within a category.',
      },
    },
    slugField(),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
