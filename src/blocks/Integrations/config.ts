import type { Block, FieldHook } from 'payload'

import { integrationCategoryOptions, integrationProductOptions } from '../../collections/Integrations'

/**
 * A grid of integrations. It can read entries from the Integrations
 * collection (all live ones, a filtered set, or a hand-picked list), or fall
 * back to the old list typed into the block itself.
 *
 * Blocks saved before populateBy existed have no value for it, so every check
 * below treats a missing value as "manual". Those pages keep working with no
 * edits.
 */
type Mode = 'all' | 'filter' | 'selection' | 'manual'
const mode = (siblingData: { populateBy?: Mode } | undefined): Mode => siblingData?.populateBy ?? 'manual'

const idOf = (v: unknown): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : null

// Visitors never get a hand-picked entry that is unpublished or not Live: it
// is dropped from the list, not shown. Logged-in editors see the list as
// saved, so they can spot and fix an entry that has gone out of date.
const onlyLiveForVisitors: FieldHook = async ({ value, req }) => {
  if (req.user || !Array.isArray(value) || value.length === 0) return value
  const ids = value.map(idOf).filter((id): id is string => Boolean(id))
  const live = await req.payload.find({
    collection: 'integrations',
    where: {
      and: [{ id: { in: ids } }, { _status: { equals: 'published' } }, { status: { equals: 'live' } }],
    },
    depth: 0,
    limit: ids.length,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const keep = new Set(live.docs.map((d) => String(d.id)))
  return value.filter((v) => {
    const id = idOf(v)
    return id !== null && keep.has(id)
  })
}

export const Integrations: Block = {
  slug: 'integrations',
  interfaceName: 'IntegrationsBlock',
  labels: { singular: 'Integrations', plural: 'Integrations' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'populateBy',
      type: 'select',
      label: 'Show',
      defaultValue: 'manual',
      options: [
        { label: 'All live integrations', value: 'all' },
        { label: 'Filter by category or product', value: 'filter' },
        { label: 'Hand-picked', value: 'selection' },
        { label: 'Manual list, old style', value: 'manual' },
      ],
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      label: 'Categories',
      options: integrationCategoryOptions,
      admin: { condition: (_, siblingData) => mode(siblingData) === 'filter' },
    },
    {
      name: 'products',
      type: 'select',
      hasMany: true,
      label: 'Products',
      options: integrationProductOptions,
      admin: { condition: (_, siblingData) => mode(siblingData) === 'filter' },
    },
    {
      name: 'featuredOnly',
      type: 'checkbox',
      label: 'Featured only',
      defaultValue: false,
      admin: { condition: (_, siblingData) => ['all', 'filter'].includes(mode(siblingData)) },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      relationTo: 'integrations',
      hasMany: true,
      label: 'Integrations',
      hooks: { afterRead: [onlyLiveForVisitors] },
      admin: { condition: (_, siblingData) => mode(siblingData) === 'selection' },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'How many',
      defaultValue: 24,
      min: 1,
      max: 24,
      admin: { condition: (_, siblingData) => ['all', 'filter'].includes(mode(siblingData)) },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Manual list (being retired)',
      minRows: 1,
      maxRows: 24,
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => mode(siblingData) === 'manual',
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name' },
        {
          name: 'summary',
          type: 'text',
          label: 'One line',
          admin: { description: 'What flows between the two systems, in plain words.' },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo (optional)',
          admin: { description: 'Transparent PNG or SVG. Leave empty to show the name only.' },
        },
      ],
    },
    {
      name: 'footnote',
      type: 'text',
      label: 'Footnote',
      admin: { description: 'For example: anything else connects over the NeuronCx REST API and webhooks.' },
    },
  ],
}
