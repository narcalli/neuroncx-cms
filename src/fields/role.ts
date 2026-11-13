import type { FieldAccess, SelectField } from 'payload'

import { isApiKeyRequest } from '@/access/apiKeyRequest'
import { hasRole } from '@/access/roles'

/** An admin signed in as themselves; never a key, an admin's included. */
const adminInPerson: FieldAccess = ({ req }) => hasRole(req.user, 'admin') && !isApiKeyRequest(req)

/**
 * Admin, Content owner or Author: one per user. Only an admin in person can
 * set or change it, never with a key. From anyone else the value is dropped,
 * so a new user gets Author and an existing user keeps their role.
 *
 * A function, so the field is a fresh copy wherever it is used.
 */
export const roleField = (): SelectField => ({
  name: 'role',
  type: 'select',
  required: true,
  defaultValue: 'author',
  options: [
    { label: 'Admin', value: 'admin' },
    { label: 'Content owner', value: 'contentOwner' },
    { label: 'Author', value: 'author' },
  ],
  access: {
    create: adminInPerson,
    update: adminInPerson,
  },
  admin: {
    position: 'sidebar',
    description: 'What this person can do in the admin. Only admins can change it.',
  },
})
