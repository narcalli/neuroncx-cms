import type { CollectionBeforeChangeHook, Validate } from 'payload'
import { text as validateText } from 'payload/shared'

import { requiredForOwnPage } from '../../fields/validators/ownPage'
import { plainTextProblem } from '../../fields/validators/plainText'
import { SLUG_PATTERN, slugFreeIn } from '../../fields/validators/slugFree'
import { autoRowDescription } from '../../hooks/autoRowDescription'
import { metaWithFallbacks } from '../../hooks/metaFallbacks'
import { oneMainRecord } from '../../hooks/oneMainRecord'
import { cutOnWord } from '../../utilities/fitText'

/**
 * Hooks and checks for the Integrations section: integration items, their
 * categories and the integrations master records. The shared parts live in
 * src/hooks and src/fields/validators; this file sets them up for
 * integrations.
 */

export { cutOnWord, fallbackMetaTitle, fitNames } from '../../utilities/fitText'
export { requiredForOwnPage } from '../../fields/validators/ownPage'

type Doc = Record<string, any>

const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' ? String((v as Doc).id) : v ? String(v) : null

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

// A category's automatic WhatsApp row description lists its live, published
// integrations. The flag is set while a refresh started by an integration is
// running, so nothing it triggers starts another refresh.
const categoryRows = autoRowDescription({
  parent: 'integrationCategories',
  items: 'integrations',
  field: 'category',
  statuses: ['live'],
  noun: 'category',
  flag: 'integrationCategoryRefresh',
})

/** Category beforeChange: fills waRowDescription while the automatic switch is on. */
export const categoryAutoRowDescription = categoryRows.parentBeforeChange

/** Integration afterChange: published, changed or unpublished. */
export const itemRefreshCategories = categoryRows.itemAfterChange

/** Integration afterDelete. */
export const itemRefreshCategoriesAfterDelete = categoryRows.itemAfterDelete

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
  data.meta = metaWithFallbacks(cur, data, originalDoc)

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
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

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
  if (typeof value === 'string' && value && !SLUG_PATTERN.test(value)) {
    return 'Lowercase letters, numbers and single dashes only, for example integrations.'
  }
  return slugFreeIn('integrations', 'integration')(value, options.req)
}

/* ------------------------------------------------------------------ */
/* Integrations master                                                 */
/* ------------------------------------------------------------------ */

/** Only one master record may have Is main on. */
export const masterOneMain = oneMainRecord('integrationsMaster')

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
