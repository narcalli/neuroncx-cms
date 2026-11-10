import type { PayloadRequest } from 'payload'

import { hasRole } from './roles'

/**
 * Content owners and admins; authors and visitors are refused. Returns a
 * boolean, so it works as collection access and as field access.
 */
export const contentOwnerOrAdmin = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  hasRole(user, 'admin', 'content-owner')
