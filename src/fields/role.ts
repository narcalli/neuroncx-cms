import type { SelectField } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * Admin, Content owner or Author: one per user. Only admins can set or change
 * it. From anyone else the value is dropped, so a new user gets Author and an
 * existing user keeps their role.
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
    { label: 'Content owner', value: 'content-owner' },
    { label: 'Author', value: 'author' },
  ],
  access: {
    create: adminOnly,
    update: adminOnly,
  },
  admin: {
    position: 'sidebar',
    description: 'What this person can do in the admin. Only admins can change it.',
  },
})
