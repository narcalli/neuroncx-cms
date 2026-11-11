import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const CONTENT_EVENTS = 'contentEvents'

export const EVENT_ACTIONS = [
  'published',
  'unpublished',
  'rolledBack',
  // The benchmark gate on a publish (src/lifecycle/benchmarkGate.ts), and overrides of it.
  'benchmarkPassed',
  'benchmarkFailed',
  'notScored',
  'overrideSet',
  'overrideCleared',
] as const
export type EventAction = (typeof EVENT_ACTIONS)[number]

/**
 * The moments versions alone do not keep: who published, unpublished or
 * rolled back an entry, and when, and what the benchmark gate said about each
 * publish. Payload writes an unpublish over the
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
    // What the benchmark gate found, or an override's reason.
    { name: 'note', type: 'textarea' },
  ],
  timestamps: true,
}
