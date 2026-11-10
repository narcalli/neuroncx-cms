import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

export type Role = User['role']

/**
 * True when the signed-in user has one of these roles (src/fields/role.ts).
 * A user saved before roles existed has none until
 * scripts/backfill-user-roles.ts runs, so passes no role check.
 */
export const hasRole = (user: PayloadRequest['user'], ...roles: Role[]): boolean =>
  Boolean(user && 'role' in user && user.role && roles.includes(user.role))
