import type { Access, Where } from 'payload'

/**
 * For collections that had drafts turned on after entries already existed:
 * logged-in users see everything; visitors see published entries, and
 * entries saved before drafts were turned on (they have no _status), so
 * nothing that shows today disappears.
 */
export const publishedOrBeforeDrafts: Access = ({ req: { user } }) => {
  if (user) return true
  const where: Where = {
    or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
  }
  return where
}
