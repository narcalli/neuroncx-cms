import type {
  Access,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  CollectionSlug,
  Field,
  Validate,
  Where,
} from 'payload'
import { APIError } from 'payload'
import { text as validateText } from 'payload/shared'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugify } from '../utilities/slugify'

/**
 * Editable lists that other collections link to: integration categories,
 * connection types, products, agent families. As collections, editors add,
 * rename and reorder them in the admin, and everything that links to an
 * entry follows, because it links instead of copying its text.
 */

const slugFormat = (example: string) => (value: unknown) =>
  typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    ? true
    : `Lowercase letters, numbers and single dashes only, for example ${example}.`

// With caps, the built-in text check runs first so maxLength holds. Without,
// the slug check stays exactly as it was (Products).
const slugRule =
  (capped: boolean, example: string): Validate =>
  (value, options) => {
    if (capped) {
      const builtIn = validateText(value, options as any)
      if (builtIn !== true) return builtIn
    }
    return slugFormat(example)(value)
  }

const baseFields = (capped: boolean, example: string): Field[] => [
  {
    name: 'name',
    type: 'text',
    required: true,
    unique: true,
    ...(capped ? { maxLength: 60 } : {}),
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    ...(capped ? { maxLength: 60 } : {}),
    admin: {
      description:
        'A short fixed code for addresses and filters. Filled in from the name if left empty. Lowercase, dashes only.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => value || (data?.name ? slugify(String(data.name)) : value),
      ],
    },
    validate: slugRule(capped, example),
  },
  {
    name: 'order',
    type: 'number',
    defaultValue: 100,
    admin: { description: 'Lower numbers come first in dropdowns and lists.' },
  },
]

// For the lists with drafts: visitors see published entries, and entries
// saved before drafts were turned on (they have no _status), so nothing that
// shows today disappears.
const publishedOrBeforeDrafts: Access = ({ req: { user } }) => {
  if (user) return true
  const where: Where = {
    or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
  }
  return where
}

// For lists created with drafts on: visitors see published entries only.
const publishedOnly: Access = ({ req: { user } }) => {
  if (user) return true
  const where: Where = { _status: { equals: 'published' } }
  return where
}

/**
 * One place that links to a list entry, so an entry in use cannot be
 * deleted. The error names up to 5 of them, for example
 * "2 integrations (DocPulse, Zenoti)" or "a block filter on 1 page (home)".
 */
export type UsedByRef = {
  collection: CollectionSlug
  /** The linking field's path, for example category or layout.categories. */
  field: string
  /** What one and several linking records are called: integration, integrations. */
  one: string
  many: string
  /** Which field names each linking record in the error. */
  show: 'name' | 'slug'
  /** Words before the count, for example "a block filter on". */
  prefix?: string
}

// Refuses to delete an entry that another record still points at, and names
// them, rather than leaving those records without the link or a block filter
// quietly showing fewer entries. Drafts count too. Checks run in list order.
export const refuseDeleteWhileUsed =
  (usedBy: UsedByRef[], noun: string): CollectionBeforeDeleteHook =>
  async ({ id, req }) => {
    const uses: string[] = []
    for (const r of usedBy) {
      const where: Where = { [r.field]: { in: [id] } }
      const found = await req.payload.find({
        collection: r.collection,
        where,
        draft: true,
        depth: 0,
        limit: 5,
        overrideAccess: true,
        req,
      })
      const n = found.totalDocs
      if (!n) continue
      const list = found.docs.map((d) => (d as unknown as Record<string, unknown>)[r.show]).join(', ')
      uses.push(
        `${r.prefix ? `${r.prefix} ` : ''}${n} ${n === 1 ? r.one : r.many} (${list}${n > 5 ? ', ...' : ''})`,
      )
    }
    if (uses.length) {
      throw new APIError(
        `This ${noun} is still used by ${uses.join(' and ')}. Move them to another ${noun} first.`,
        400,
        null,
        true,
      )
    }
  }

export const taxonomy = (opts: {
  slug: string
  singular: string
  plural: string
  description: string
  group?: string
  usedBy: UsedByRef[]
  noun: string
  fields?: Field[]
  /** Caps name and slug at 60 characters. */
  capped?: boolean
  /** Drafts on, no autosave. */
  drafts?: boolean
  /**
   * Who sees what without logging in, with drafts on.
   * publishedOrBeforeDrafts (default): published entries, and entries saved
   * before drafts were turned on. published: published entries only.
   * Without drafts, every entry is public.
   */
  publicRead?: 'publishedOrBeforeDrafts' | 'published'
  /** The example in the slug format message. */
  slugExample?: string
  hooks?: CollectionConfig['hooks']
}): CollectionConfig => ({
  slug: opts.slug,
  labels: { singular: opts.singular, plural: opts.plural },
  access: {
    create: authenticated,
    delete: authenticated,
    read: opts.drafts
      ? opts.publicRead === 'published'
        ? publishedOnly
        : publishedOrBeforeDrafts
      : anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    description: opts.description,
    ...(opts.group ? { group: opts.group } : {}),
  },
  defaultSort: 'order',
  hooks: { ...opts.hooks, beforeDelete: [refuseDeleteWhileUsed(opts.usedBy, opts.noun)] },
  ...(opts.drafts ? { versions: { drafts: true } } : {}),
  fields: [
    ...baseFields(Boolean(opts.capped), opts.slugExample || 'hospital-systems'),
    ...(opts.fields || []),
  ],
})
