import type { Access, Where } from 'payload'

/**
 * Logged-in users see everything. Visitors, and anyone reading the public
 * REST or GraphQL API, see published entries whose status is Live or Pilot.
 * For collections that use statusField (src/fields/status.ts).
 */
export const publicLiveOrPilot: Access = ({ req: { user } }) => {
  if (user) return true

  const publishedLiveOrPilot: Where = {
    and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
  }
  return publishedLiveOrPilot
}
