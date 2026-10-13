import type { Field, RowField, Validate } from 'payload'
import { slugField } from 'payload'
import { text as validateText } from 'payload/shared'

/**
 * Core group (fields_reference.md, section 1): name, slug, featured, order
 * and isUSP, all in the sidebar. Collections add their own sidebar fields,
 * such as statusField(), next to these.
 */

// Lowercase words joined by single dashes: "Customer 360" becomes customer-360.
const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slugRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  return typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Lowercase letters, numbers and single dashes only, for example customer-360.'
}

export const coreFields = (): Field[] => [
  {
    name: 'name',
    type: 'text',
    required: true,
    unique: true,
    admin: { position: 'sidebar' },
  },
  // Generated from the name and editable, like the slug on Pages and Posts.
  slugField({
    useAsSlug: 'name',
    slugify: ({ valueToSlugify }) =>
      typeof valueToSlugify === 'string' ? toSlug(valueToSlugify) : undefined,
    overrides: (row: RowField): RowField => ({
      ...row,
      fields: row.fields.map(
        (field): Field =>
          field.type === 'text' && field.name === 'slug' ? { ...field, validate: slugRule } : field,
      ),
    }),
  }),
  {
    name: 'featured',
    type: 'checkbox',
    defaultValue: false,
    admin: { position: 'sidebar', description: 'Shown first wherever this collection is listed.' },
  },
  {
    name: 'order',
    type: 'number',
    defaultValue: 100,
    admin: {
      position: 'sidebar',
      description: 'Lower shows first, on grids and in WhatsApp lists.',
    },
  },
  {
    name: 'isUSP',
    type: 'checkbox',
    label: 'USP (sets NeuronCx apart)',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: 'Lets blocks pull out the entries that most set NeuronCx apart.',
    },
  },
]
