import type { PayloadRequest } from 'payload'

import { hasRole } from './roles'

/**
 * Admins only. Returns a boolean, so it works as collection access and as
 * field access (the role field uses it).
 */
export const adminOnly = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  hasRole(user, 'admin')
