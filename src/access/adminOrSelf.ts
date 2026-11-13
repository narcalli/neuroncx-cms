import type { Access } from 'payload'

import { isApiKeyRequest } from './apiKeyRequest'
import { hasRole } from './roles'

/**
 * For users: an admin signed in as themselves reaches every user; anyone
 * else, an admin's key included, only their own record. A user record holds
 * its API key, so reading other users would hand out their keys (GHSA-238x).
 * A signed-in record from another collection (an MCP key) matches no user.
 */
export const adminOrSelf: Access = ({ req }) => {
  const { user } = req
  if (hasRole(user, 'admin') && !isApiKeyRequest(req)) return true
  if (!user || user.collection !== 'users') return false
  return { id: { equals: user.id } }
}
