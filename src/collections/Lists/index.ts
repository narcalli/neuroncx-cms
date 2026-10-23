import type { CollectionConfig, Validate, Where } from 'payload'
import { slugField } from 'payload'
import { text as validateText } from 'payload/shared'

import { authenticated } from '../../access/authenticated'
import { collectionForListType, hubPagePath } from '../../content/registry'
import { publishedOrBeforeDrafts } from '../../access/publishedOrBeforeDrafts'
import { GROUPING_CARD_DESIGNS, itemCardDesignField } from '../../fields/cardDesign'
import { slugRule, toSlug } from '../../fields/core'
import { iconField } from '../../fields/icons'
import { plainText } from '../../fields/validators/plainText'
import { previewUrl } from '../../utilities/generatePreviewPath'

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
 *
 * Every type has the same grouping fields (foundation.md section 6.2): the
 * heading copy on the hub, an icon, a card design between the entry's and
 * the section's, and the entry as a row in a WhatsApp menu.
 *
 * Drafts are on. Entries saved before that have no _status and stay visible
 * to visitors (publishedOrBeforeDrafts).
 */

const TYPES = [
  { label: 'CRM area', value: 'crmArea' },
  { label: 'Agent family', value: 'agentFamily' },
] as const

/** The kinds of list, such as crmArea. A content collection groups its entries by one. */
export type ListType = (typeof TYPES)[number]['value']

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

/** A grouping previews on the hub page of the collection it groups, in draft mode. */
const listPreview = (doc: Record<string, any>): string | null => {
  const entry = collectionForListType(doc?.type)
  const path = entry ? hubPagePath(entry) : null
  return path ? previewUrl(path) : null
}

export const Lists: CollectionConfig = {
  slug: 'lists',
  labels: { singular: 'List entry', plural: 'Lists' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrBeforeDrafts,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'order'],
    group: 'Platform',
    description:
      'Short lists other collections group their entries by, such as CRM areas and agent families.',
    livePreview: { url: ({ data }) => listPreview(data) },
    preview: (doc) => listPreview(doc),
  },
  defaultSort: 'order',
  versions: { drafts: { autosave: false } },
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
      admin: { description: "One line under the grouping's heading on the hub page." },
    },
    {
      name: 'painLine',
      type: 'text',
      label: 'Pain line (optional)',
      maxLength: 120,
      admin: { description: "The problem the grouping solves, in the team's words." },
    },
    {
      name: 'summary',
      type: 'text',
      maxLength: 200,
      admin: { description: 'How the entries in the grouping work together.' },
    },
    iconField(undefined, { description: 'Shown with the grouping heading on the hub page.' }),
    itemCardDesignField({
      clearLabel: 'Follow the section',
      designs: GROUPING_CARD_DESIGNS,
      description:
        "Every entry in this grouping uses it, unless the entry has its own. Leave empty to follow the section. Used only where the section allows it. Product suite draws the grouping's whole section on the hub page as large cards with each entry's steps.",
    }),
    {
      name: 'waRowTitle',
      type: 'text',
      label: 'Row title (WhatsApp menu)',
      maxLength: 24,
      validate: plainText,
      admin: { description: 'The grouping as a row in a WhatsApp list menu. Plain text.' },
    },
    {
      name: 'waRowDescription',
      type: 'text',
      label: 'Row description (WhatsApp menu)',
      maxLength: 70,
      validate: plainText,
      admin: { description: 'The line under the row title. Aim for 60 characters. Plain text.' },
    },
  ],
}
