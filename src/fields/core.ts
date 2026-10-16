import type { Field, Validate } from 'payload'

/**
 * Core group (fields_reference.md, section 1). Each field is its own builder,
 * so a collection keeps its own order and placement: integrations has `name`
 * above the tabs and the rest in the sidebar, with its own sidebar fields
 * (category, connection...) in between.
 */

export const nameField = (opts: { maxLength?: number } = {}): Field => ({
  name: 'name',
  type: 'text',
  required: true,
  unique: true,
  ...(opts.maxLength ? { maxLength: opts.maxLength } : {}),
})

/** The live, pilot or planned select, in the sidebar. */
export const statusField = (opts: { defaultValue: 'live' | 'pilot' | 'planned'; description: string }): Field => ({
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: opts.defaultValue,
  options: [
    { label: 'Live', value: 'live' },
    { label: 'Pilot', value: 'pilot' },
    { label: 'Planned', value: 'planned' },
  ],
  admin: { position: 'sidebar', description: opts.description },
})

export const featuredField = (opts: { description: string }): Field => ({
  name: 'featured',
  type: 'checkbox',
  defaultValue: false,
  admin: { position: 'sidebar', description: opts.description },
})

export const orderField = (opts: { description: string }): Field => ({
  name: 'order',
  type: 'number',
  defaultValue: 100,
  admin: { position: 'sidebar', description: opts.description },
})

/** Unique and indexed, 60 characters. The collection supplies the rule and whether it is required. */
export const slugField = (opts: {
  validate: Validate
  description: string
  required?: boolean
}): Field => ({
  name: 'slug',
  type: 'text',
  ...(opts.required ? { required: true } : {}),
  unique: true,
  index: true,
  maxLength: 60,
  validate: opts.validate,
  admin: { position: 'sidebar', description: opts.description },
})

/** Marks a differentiator so blocks can pull it out. */
export const isUSPField = (opts: { description: string }): Field => ({
  name: 'isUSP',
  type: 'checkbox',
  label: 'Is a USP',
  defaultValue: false,
  admin: { position: 'sidebar', description: opts.description },
})
