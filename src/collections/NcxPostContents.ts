import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Which NCX post content each website section was sent to. Written only by
 * the sync (src/rag/sync.ts); editors can read it to see what the bot has.
 */
export const NcxPostContents: CollectionConfig = {
  slug: 'ncxPostContents',
  labels: { singular: 'NCX post content', plural: 'NCX post contents' },
  access: {
    read: authenticated,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: 'System',
    useAsTitle: 'title',
    defaultColumns: ['title', 'sourceCollection', 'pcmId', 'archived', 'syncedAt'],
    description:
      'Website sections sent to NeuronCX post content for the WhatsApp bot. New ones wait for approval in the NCX dashboard.',
  },
  timestamps: true,
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'sourceCollection', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sectionKey', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'title', type: 'text', admin: { readOnly: true } },
    { name: 'pcmId', type: 'number', label: 'Post content id', admin: { readOnly: true } },
    {
      name: 'hash',
      type: 'text',
      admin: { readOnly: true, description: 'Empty when the section needs sending again, or is archived.' },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { readOnly: true, description: 'The section left the site, so its post content is archived in NCX.' },
    },
    { name: 'syncedAt', type: 'date', admin: { readOnly: true } },
  ],
}
