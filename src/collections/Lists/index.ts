import type { CollectionConfig, Validate, Where } from 'payload'
import { slugField } from 'payload'
import { text as validateText } from 'payload/shared'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { slugRule, toSlug } from '../../fields/core'

/**
 * Small editable lists the content collections group their entries by, kept
 * in one collection and told apart by type: CRM areas for B2C CRM features,
 * agent families for the micro-apps swarm. Editors can rename or add entries
 * without a deploy. A relationship to one kind filters on type, for example
 * filterOptions: { type: { equals: 'crmArea' } }.
 *
 * Names and slugs are unique within a type, so a CRM area and an agent family
 * may share one. Enforced by the compound indexes below, with a validation
 * message first so editors see why.
 */

const TYPES = [
  { label: 'CRM area', value: 'crmArea' },
  { label: 'Agent family', value: 'agentFamily' },
] as const

const typeLabel = (type: unknown) => TYPES.find((t) => t.value === type)?.label ?? 'entry'

const uniqueWithinType =
  (field: 'name' | 'slug', ownRule: Validate): Validate =>
  async (value, options) => {
    const own = await ownRule(value, options)
    if (own !== true) return own

    const { data, id, req } = options
    const type = (data as { type?: string } | undefined)?.type
    if (typeof value !== 'string' || !value || !type || !req?.payload) return true

    const and: Where[] = [{ [field]: { equals: value } }, { type: { equals: type } }]
    if (id) and.push({ id: { not_equals: id } })
    const found = await req.payload.find({
      collection: 'lists',
      where: { and },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
    })
    return found.docs.length ? `Another ${typeLabel(type)} already uses this ${field}.` : true
  }

const nameRule = uniqueWithinType('name', (value, options) => validateText(value, options as any))

const onlyFor =
  (type: (typeof TYPES)[number]['value']) =>
  (_: unknown, siblingData: { type?: string } | undefined) =>
    siblingData?.type === type

export const Lists: CollectionConfig = {
  slug: 'lists',
  labels: { singular: 'List entry', plural: 'Lists' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'order'],
    group: 'Platform',
    description:
      'Short lists other collections group their entries by, such as CRM areas and agent families.',
  },
  defaultSort: 'order',
  indexes: [
    { fields: ['name', 'type'], unique: true },
    { fields: ['slug', 'type'], unique: true },
  ],
  fields: [
    { name: 'name', type: 'text', required: true, validate: nameRule },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [...TYPES],
      admin: { description: 'Which list this entry belongs to.' },
    },
    // Unique within a type only, so the slug's own collection-wide check is off.
    slugField({
      useAsSlug: 'name',
      disableUnique: true,
      slugify: ({ valueToSlugify }) =>
        typeof valueToSlugify === 'string' ? toSlug(valueToSlugify) : undefined,
      overrides: (row) => ({
        ...row,
        fields: row.fields.map((field) =>
          field.type === 'text' && field.name === 'slug'
            ? { ...field, validate: uniqueWithinType('slug', slugRule) }
            : field,
        ),
      }),
    }),
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Lower shows first, on hub pages and in WhatsApp menus.',
      },
    },
    {
      name: 'intro',
      type: 'text',
      maxLength: 140,
      admin: {
        condition: onlyFor('crmArea'),
        description: "One line shown above the area's features on the CRM hub page.",
      },
    },
    {
      name: 'painLine',
      type: 'text',
      label: 'Pain line',
      maxLength: 120,
      admin: {
        condition: onlyFor('agentFamily'),
        description: "The problem the family solves, in the team's words.",
      },
    },
    {
      name: 'summary',
      type: 'text',
      maxLength: 200,
      admin: {
        condition: onlyFor('agentFamily'),
        description: 'How the agents in the family work together.',
      },
    },
  ],
}
