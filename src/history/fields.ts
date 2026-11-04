import type { Field, FieldAccess } from 'payload'

/** Visitors never see who edited an entry, or its rollback marker. */
const signedIn: FieldAccess = ({ req }) => Boolean(req.user)

export const HISTORY_FIELD_NAMES = ['updatedBy', 'rolledBackFrom'] as const

/**
 * Stored on the entry and so copied into every version: who saved it, and
 * the version a rollback came from. Both are set by stampEditor
 * (src/history/hooks.ts), never by hand.
 */
export const historyFields = (): Field[] => [
  {
    name: 'updatedBy',
    type: 'relationship',
    relationTo: 'users',
    label: 'Last edited by',
    access: { read: signedIn, create: () => false, update: () => false },
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'rolledBackFrom',
    type: 'text',
    access: { read: signedIn, create: () => false, update: () => false },
    admin: { hidden: true },
  },
]
