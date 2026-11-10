import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { adminOrSelf } from '../../access/adminOrSelf'
import { authenticated } from '../../access/authenticated'
import { roleField } from '../../fields/role'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    // Admins manage every user. Anyone else can change only their own record
    // (never their role, see src/fields/role.ts), so nobody can take over an
    // admin by resetting the admin's password or API key.
    delete: adminOnly,
    read: authenticated,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: {
    // Lets an admin create a REST API key for a user (used by scripts such as
    // scripts/promote-page.mjs). The MCP keys are a separate collection.
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    roleField(),
  ],
  timestamps: true,
}
