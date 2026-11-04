import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const CONTENT_EVENTS = 'contentEvents'

export const EVENT_ACTIONS = ['published', 'unpublished', 'rolledBack'] as const
export type EventAction = (typeof EVENT_ACTIONS)[number]

/**
 * The moments versions alone do not keep: who published, unpublished or
 * rolled back an entry, and when. Payload writes an unpublish over the
 * latest version in place (payload/dist/versions/saveVersion.js), so without
 * this log a version that was once live stops saying so. Written only by the
 * history hooks (src/history/hooks.ts), read by the History tab.
 */
export const ContentEvents: CollectionConfig = {
  slug: CONTENT_EVENTS,
  labels: { singular: 'Content event', plural: 'Content events' },
  access: {
    read: authenticated,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: { hidden: true },
  lockDocuments: false,
  indexes: [{ fields: ['collectionSlug', 'doc'] }],
  fields: [
    { name: 'collectionSlug', type: 'text', required: true, index: true },
    { name: 'doc', type: 'text', required: true, index: true },
    { name: 'action', type: 'select', required: true, options: [...EVENT_ACTIONS] },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'version', type: 'text' },
    { name: 'fromVersion', type: 'text' },
  ],
  timestamps: true,
}
