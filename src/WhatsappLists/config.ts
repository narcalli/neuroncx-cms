import type { ArrayField, GlobalConfig } from 'payload'
import { array as validateArray } from 'payload/shared'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { plainText } from '../fields/validators/plainText'

/**
 * List-level text for the WhatsApp assistant's menus (fields_reference.md,
 * section 6): the button that opens a list and the heading above its rows.
 * These describe a whole list, not one entry, so they live here once per
 * collection rather than on every entry.
 */

const COLLECTIONS = [
  { label: 'B2C CRM', value: 'crmFeatures' },
  { label: 'Micro-apps swarm', value: 'microApps' },
  { label: 'Omnichannel CX', value: 'omnichannelCx' },
]

// The built-in row checks first, then one row per collection.
const oncePerCollection: ArrayField['validate'] = (value, options) => {
  const builtIn = validateArray(value, options)
  if (builtIn !== true) return builtIn
  const seen = new Set<string>()
  for (const row of (value as { collection?: string }[] | null | undefined) ?? []) {
    if (!row?.collection) continue
    if (seen.has(row.collection)) {
      const label = COLLECTIONS.find((c) => c.value === row.collection)?.label ?? row.collection
      return `${label} appears more than once. Each collection needs one row only.`
    }
    seen.add(row.collection)
  }
  return true
}

export const WhatsappLists: GlobalConfig = {
  slug: 'whatsappLists',
  label: 'WhatsApp lists',
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    description:
      'The list button and section title the WhatsApp assistant uses for each collection.',
  },
  fields: [
    {
      name: 'lists',
      type: 'array',
      labels: { singular: 'List', plural: 'Lists' },
      validate: oncePerCollection,
      admin: { description: 'One row per collection.' },
      fields: [
        {
          name: 'collection',
          type: 'select',
          required: true,
          options: COLLECTIONS,
        },
        {
          name: 'waListButton',
          type: 'text',
          label: 'List button',
          maxLength: 20,
          validate: plainText,
          admin: { description: 'The button that opens the list in WhatsApp.' },
        },
        {
          name: 'waSectionTitle',
          type: 'text',
          label: 'Section title',
          maxLength: 24,
          validate: plainText,
          admin: { description: 'The heading above the rows in the list.' },
        },
      ],
    },
  ],
}
