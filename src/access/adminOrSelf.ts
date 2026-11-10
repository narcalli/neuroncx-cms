import type { Access } from 'payload'

import { hasRole } from './roles'

/**
 * For users: admins reach every user, anyone else only their own record. A
 * signed-in record from another collection (an MCP key) matches no user.
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (hasRole(user, 'admin')) return true
  if (!user) return false
  return { id: { equals: user.id } }
}
