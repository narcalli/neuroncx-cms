import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  PayloadRequest,
  Validate,
} from 'payload'
import { ValidationError } from 'payload'
import { text as validateText, textarea as validateTextarea } from 'payload/shared'

import { plainTextProblem } from '../../fields/validators/plainText'

/**
 * Hooks and checks for the Integrations section: integration items, their
 * categories and the integrations master records.
 */

type Doc = Record<string, any>

const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' ? String((v as Doc).id) : v ? String(v) : null

/** Cuts text to max characters on a whole word, or hard if one word is longer. */
export const cutOnWord = (text: string, max: number): string => {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : t.slice(0, max)).replace(/[\s,]+$/, '')
}

/** "<keyword> with NeuronCx | NeuronCx", 60 characters at most. */
export const fallbackMetaTitle = (subject: string): string => {
  const suffix = ' | NeuronCx'
  return `${cutOnWord(`${subject} with NeuronCx`, 60 - suffix.length)}${suffix}`
}

/** Names joined with commas, as many whole names as fit in max characters. */
export const fitNames = (names: string[], max = 70): string => {
  let out = ''
  for (const name of names) {
    const next = out ? `${out}, ${name}` : name
    if (next.length > max) break
    out = next
  }
  return out
}

// Set while a category refresh started by an integration is running, so
// nothing it triggers starts another refresh.
const REFRESH_FLAG = 'integrationCategoryRefresh'

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/** Names of the live, published integrations in a category, in order. */
const liveNamesInCategory = async (req: PayloadRequest, categoryId: string) => {
  const found = await req.payload.find({
    collection: 'integrations',
    where: {
      and: [
        { category: { equals: categoryId } },
        { _status: { equals: 'published' } },
        { status: { equals: 'live' } },
      ],
    },
    sort: ['order', 'name'],
    limit: 100,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  return found.docs.map((d) => String(d.name))
}

/** Category beforeChange: fills waRowDescription while the automatic switch is on. */
export const categoryAutoRowDescription: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const auto = data.waRowDescriptionAuto ?? originalDoc?.waRowDescriptionAuto
  if (!auto) return data
  const id = idOf(originalDoc?.id)
  data.waRowDescription = id ? fitNames(await liveNamesInCategory(req, id)) : ''
  return data
}

/** Refreshes the automatic row description of these categories, when it changed. */
const refreshCategories = async (req: PayloadRequest, ids: (string | null)[]) => {
  for (const id of new Set(ids.filter(Boolean) as string[])) {
    try {
      const category = (await req.payload.findByID({
        collection: 'integrationCategories',
        id,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
        req,
      })) as Doc | null
      if (!category?.waRowDescriptionAuto) continue
      const text = fitNames(await liveNamesInCategory(req, id))
      if (text === (category.waRowDescription || '')) continue
      // Written through the database adapter, not payload.update. This runs
      // inside the integration's own save (its database transaction in
      // production). A full Payload update that failed there would abort that
      // transaction and so the integration's save, whatever the catch below
      // does. The adapter write runs no validation and no hooks, so it cannot
      // fail on a rule, cannot start another refresh, leaves the category's
      // status as it is, and adds no new version.
      req.context[REFRESH_FLAG] = true
      try {
        await req.payload.db.updateOne({
          collection: 'integrationCategories',
          where: { id: { equals: id } },
          data: { waRowDescription: text },
          returning: false,
          req,
        })
        // The admin shows a category's latest saved version, so that gets
        // the same text. If an editor has an open draft, the draft gets it.
        const latest = await req.payload.db.findVersions({
          collection: 'integrationCategories',
          where: { and: [{ parent: { equals: id } }, { latest: { equals: true } }] },
          limit: 1,
          pagination: false,
          req,
        })
        const version = latest.docs[0] as Doc | undefined
        if (version) {
          await req.payload.db.updateVersion({
            collection: 'integrationCategories',
            id: version.id,
            versionData: { ...version, version: { ...version.version, waRowDescription: text } },
            returning: false,
            req,
          })
        }
      } finally {
        delete req.context[REFRESH_FLAG]
      }
    } catch (err) {
      // A failed refresh must not stop the integration from saving.
      req.payload.logger.error({ err, msg: `Could not refresh category ${id}` })
    }
  }
}

/** Integration afterChange: published, changed or unpublished. */
export const itemRefreshCategories: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context?.[REFRESH_FLAG]) return doc
  await refreshCategories(req, [idOf(doc?.category), idOf(previousDoc?.category)])
  return doc
}

/** Integration afterDelete. */
export const itemRefreshCategoriesAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.[REFRESH_FLAG]) return doc
  await refreshCategories(req, [idOf(doc?.category)])
  return doc
}

/* ------------------------------------------------------------------ */
/* Integration items                                                   */
/* ------------------------------------------------------------------ */

/**
 * Integration beforeChange: fallbacks for empty fields, waLink, and the
 * setup checklist prefill. Collection hooks run before field validation, so
 * a filled fallback counts when the publish checks run.
 */
export const itemFallbacks: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  // Partial updates (scripts) carry only some fields; read the rest from the saved document.
  const cur: Doc = { ...originalDoc, ...data }
  const meta: Doc = { ...originalDoc?.meta, ...data.meta }

  if (!meta.title && (cur.primaryKeyword || cur.name)) {
    meta.title = fallbackMetaTitle(String(cur.primaryKeyword || cur.name))
  }
  if (!meta.description && cur.summary) meta.description = cur.summary
  data.meta = meta

  // WhatsApp fields are plain text. A name or summary that is not is left
  // out, so a publish never fails on a field the editor did not type.
  if (!cur.waRowTitle && cur.name) {
    const title = cutOnWord(String(cur.name), 24)
    if (!plainTextProblem(title)) data.waRowTitle = title
  }
  if (
    !cur.waRowDescription &&
    cur.summary &&
    String(cur.summary).length <= 70 &&
    !plainTextProblem(String(cur.summary))
  ) {
    data.waRowDescription = cur.summary
  }

  data.waLink = cur.slug
    ? cur.hasOwnPage
      ? `/integrations/${cur.slug}`
      : `/integrations#${cur.slug}`
    : null

  // Prefill once per connection type: setupChecklistSource remembers which
  // connection type the checklist was last filled from. An editor who clears
  // the checklist keeps it clear; changing the connection fills it again.
  const connection = idOf(cur.connection)
  const checklist = cur.setupChecklist
  if (
    connection &&
    connection !== cur.setupChecklistSource &&
    (!Array.isArray(checklist) || checklist.length === 0)
  ) {
    const type = (await req.payload.findByID({
      collection: 'connectionTypes',
      id: connection,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
      req,
    })) as Doc | null
    if (type?.defaultChecklist?.length) {
      data.setupChecklist = type.defaultChecklist.map((row: Doc) => ({
        item: row.item,
        providedBy: row.providedBy,
      }))
      data.setupChecklistSource = connection
    }
  }

  return data
}

/* ------------------------------------------------------------------ */
/* Shared checks                                                       */
/* ------------------------------------------------------------------ */

const publishing = (data: unknown) => (data as Doc | undefined)?._status === 'published'
const ownPageOn = (data: unknown) => Boolean((data as Doc | undefined)?.hasOwnPage)
const empty = (v: unknown) => typeof v !== 'string' || !v.trim()

/**
 * A text field that must be filled to publish an integration with Own page
 * on. Drafts save without it.
 */
export const requiredForOwnPage =
  (what: string): Validate =>
  (value, options) => {
    const own = (options as { type?: string }).type === 'textarea' ? validateTextarea : validateText
    const builtIn = own(value as any, options as any)
    if (builtIn !== true) return builtIn
    if (ownPageOn(options.data) && publishing(options.data) && empty(value)) {
      return `Add ${what} before publishing with Own page on.`
    }
    return true
  }

/** Refuses a slug that a record in the other collection already uses. */
const slugFreeIn =
  (other: 'integrations' | 'integrationsMaster', otherName: string) =>
  async (value: unknown, req: PayloadRequest): Promise<true | string> => {
    if (typeof value !== 'string' || !value) return true
    const found = await req.payload.find({
      collection: other,
      where: { slug: { equals: value } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const clash = found.docs[0] as Doc | undefined
    return clash
      ? `The ${otherName} "${clash.name}" already uses the slug ${value}. Choose another one.`
      : true
  }

/** Integration slug: optional, 60 characters, free of master slugs, needed for an own page. */
export const itemSlugRule: Validate = async (value, options) => {
  const ownPage = await requiredForOwnPage('a slug')(value, options)
  if (ownPage !== true) return ownPage
  return slugFreeIn('integrationsMaster', 'integrations master record')(value, options.req)
}

/** Master slug: required, lowercase with dashes, free of integration slugs. */
export const masterSlugRule: Validate = async (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  if (typeof value === 'string' && value && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
    return 'Lowercase letters, numbers and single dashes only, for example integrations.'
  }
  return slugFreeIn('integrations', 'integration')(value, options.req)
}

/* ------------------------------------------------------------------ */
/* Integrations master                                                 */
/* ------------------------------------------------------------------ */

/** Only one master record may have Is main on. */
export const masterOneMain: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const isMain = data.isMain ?? originalDoc?.isMain
  if (!isMain) return data
  const others = await req.payload.find({
    collection: 'integrationsMaster',
    where: {
      and: [
        { isMain: { equals: true } },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const holder = others.docs[0] as Doc | undefined
  if (holder) {
    throw new ValidationError({
      collection: 'integrationsMaster',
      errors: [
        {
          path: 'isMain',
          message: `"${holder.name}" is already the main record. Turn Is main off there first.`,
        },
      ],
      req,
    })
  }
  return data
}

/** Heading labels may use {name} and no other placeholder. */
export const onlyNameToken: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  if (typeof value !== 'string') return true
  const rest = value.replace(/\{name\}/g, '')
  const token = rest.match(/\{[^}]*\}?|\}/)
  return token
    ? `Only {name} can be used here. Remove ${token[0]}, for example: What moves between {name} and NeuronCx.`
    : true
}
