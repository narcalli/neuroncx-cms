import type { CollectionConfig } from 'payload'

import { adminInPerson } from '../../access/adminInPerson'
import { adminOrSelf } from '../../access/adminOrSelf'
import { authenticated } from '../../access/authenticated'
import { roleField } from '../../fields/role'
import { keysCannotChangeSignIn, signedInAdmin } from './signIn'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    // Only an admin signed in as themselves adds people; never a key (./signIn.ts).
    create: signedInAdmin,
    // An admin in person manages every user. Anyone else, an admin's key
    // included, reads and changes only their own record (never their role, see
    // src/fields/role.ts): a user record holds its API key, so nobody can read
    // another user's key or take over an admin by resetting the admin's
    // password. A key cannot change sign-in details at all, its owner's
    // included (keysCannotChangeSignIn).
    delete: adminInPerson,
    read: adminOrSelf,
    unlock: adminInPerson,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  hooks: {
    beforeOperation: [keysCannotChangeSignIn],
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
