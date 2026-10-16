import type { CollectionBeforeChangeHook, FieldHook, Validate } from 'payload'
import { relationship as validateRelationship, text as validateText } from 'payload/shared'

import { nameTokenRule } from '../../fields/validators/nameToken'
import { publishing, requiredForOwnPage, isEmptyText } from '../../fields/validators/ownPage'
import { checkPlainText, plainTextProblem } from '../../fields/validators/plainText'
import {
  SLUG_PATTERN,
  type SlugClash,
  slugFreeIn,
  slugFreeInAll,
} from '../../fields/validators/slugFree'
import { autoRowDescription } from '../../hooks/autoRowDescription'
import { metaWithFallbacks } from '../../hooks/metaFallbacks'
import { oneMainRecord } from '../../hooks/oneMainRecord'
import { cutOnWord } from '../../utilities/fitText'

/**
 * Hooks and checks for the bot swarm: micro-apps (agents) and their
 * families. Built on the shared helpers in src/hooks and src/fields/validators.
 */

type Doc = Record<string, any>

const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' ? String((v as Doc).id) : v ? String(v) : null

/* ------------------------------------------------------------------ */
/* Families                                                            */
/* ------------------------------------------------------------------ */

// A family's automatic WhatsApp row description lists its live and pilot
// agents that are published. The flag is set while a refresh started by an
// agent is running, so nothing it triggers starts another refresh.
const familyRows = autoRowDescription({
  parent: 'agentFamilies',
  items: 'microApps',
  field: 'family',
  statuses: ['live', 'pilot'],
  noun: 'family',
  flag: 'agentFamilyRefresh',
})

/** Family beforeChange: fills waRowDescription while the automatic switch is on. */
export const familyAutoRowDescription = familyRows.parentBeforeChange

/** Micro-app afterChange: published, changed or unpublished. */
export const microAppRefreshFamilies = familyRows.itemAfterChange

/** Micro-app afterDelete. */
export const microAppRefreshFamiliesAfterDelete = familyRows.itemAfterDelete

/* ------------------------------------------------------------------ */
/* Micro-apps                                                          */
/* ------------------------------------------------------------------ */

/**
 * Micro-app beforeChange: the SEO fallbacks and the WhatsApp row, as on
 * integration items, and waLink. Collection hooks run before field
 * validation, so a filled fallback counts when the publish checks run.
 */
export const microAppFallbacks: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  // Partial updates (scripts) carry only some fields; read the rest from the saved document.
  const cur: Doc = { ...originalDoc, ...data }
  data.meta = metaWithFallbacks(cur, data, originalDoc)

  // An empty row title or description is filled from the name and summary,
  // cut on a whole word to 24 and 70 characters. WhatsApp fields are plain
  // text: a name or summary that is not is left out, so a publish never
  // fails on a field the editor did not type. A cut name shows a note on the
  // row title (fields/admin/RowTitleNote.tsx).
  if (!cur.waRowTitle && cur.name) {
    const title = cutOnWord(String(cur.name), 24)
    if (!plainTextProblem(title)) data.waRowTitle = title
  }
  if (!cur.waRowDescription && cur.summary) {
    const line = cutOnWord(String(cur.summary), 70)
    if (!plainTextProblem(line)) data.waRowDescription = line
  }
  // Only from a valid slug, so a bad slug shows the slug error alone.
  data.waLink = SLUG_PATTERN.test(String(cur.slug || ''))
    ? cur.hasOwnPage
      ? `/bot-swarm/${cur.slug}`
      : `/bot-swarm#${cur.slug}`
    : null
  return data
}

/**
 * Collections whose slugs share the /bot-swarm address space with agents,
 * checked by microAppSlugRule. microAppsMasterSlugRule below does the
 * reverse check.
 */
export const MICRO_APPS_SLUG_CLASHES: SlugClash[] = [
  { collection: 'microAppsMaster', name: 'bot swarm master record' },
]

/** Agent slug: required, 60 characters, lowercase with dashes, free of master slugs. */
export const microAppSlugRule: Validate = async (value, options) => {
  const builtIn = validateText(value as any, options as any)
  if (builtIn !== true) return builtIn
  if (typeof value === 'string' && value && !SLUG_PATTERN.test(value)) {
    return 'Lowercase letters, numbers and single dashes only, for example payment-services.'
  }
  return slugFreeInAll(MICRO_APPS_SLUG_CLASHES, value, options.req)
}

/** A plain text field that must be filled to publish with Own page on. */
export const plainForOwnPage =
  (what: string): Validate =>
  async (value, options) => {
    const ownPage = await requiredForOwnPage(what)(value, options)
    if (ownPage !== true) return ownPage
    return checkPlainText(value)
  }

/** What an own page needs, by field path, with the name an error shows. */
const OWN_PAGE_NEEDS: [path: string, label: string][] = [
  ['heroHeading', 'Hero heading'],
  ['startsWhen', 'Starts when'],
  ['hears', 'Hears'],
  ['checks', 'Checks'],
  ['acts', 'Acts'],
  ['handsOver', 'Hands over'],
  ['records', 'Records'],
  ['teamControls', 'Team controls'],
  ['result', 'Result'],
  ['proof', 'Proof'],
]

/**
 * Own page switch: publishing with it on needs status Live and every field
 * in OWN_PAGE_NEEDS. The error names what is missing. Each of those fields
 * also shows its own error.
 */
export const ownPageRule: Validate = (value, options) => {
  const data = options.data as Doc | undefined
  if (!value || !publishing(data)) return true
  const missing: string[] = []
  if (data?.status !== 'live') missing.push('Status set to Live')
  for (const [path, label] of OWN_PAGE_NEEDS) {
    if (isEmptyText(data?.[path])) missing.push(label)
  }
  return missing.length
    ? `Own page needs: ${missing.join(', ')}. Fill these in, or turn Own page off.`
    : true
}

/** Passes to: never the agent itself, then the built-in relationship check. */
export const notItself: Validate = (value, options) => {
  const self = options.id ? String(options.id) : null
  if (self && Array.isArray(value) && value.some((v) => idOf(v) === self)) {
    return 'An agent cannot pass to itself. Remove it from this list.'
  }
  return validateRelationship(value as any, options as any)
}

/* ------------------------------------------------------------------ */
/* Bot swarm master                                                    */
/* ------------------------------------------------------------------ */

/** Master slug: required, lowercase with dashes, free of agent slugs. */
export const microAppsMasterSlugRule: Validate = async (value, options) => {
  const builtIn = validateText(value as any, options as any)
  if (builtIn !== true) return builtIn
  if (typeof value === 'string' && value && !SLUG_PATTERN.test(value)) {
    return 'Lowercase letters, numbers and single dashes only, for example bot-swarm.'
  }
  return slugFreeIn('microApps', 'agent')(value, options.req)
}

/** Only one bot swarm master record may have Is main on. */
export const microAppsMasterOneMain = oneMainRecord('microAppsMaster')

/** Agent page labels may use {name} and no other placeholder. */
export const agentLabelRule = nameTokenRule('How {name} works')

/**
 * Proof strip rows marked pending are left out of what visitors receive.
 * Logged-in editors and server-side reads (overrideAccess, which includes
 * the read Payload makes before an update) keep them, so a save never drops
 * a pending row.
 */
export const hidePendingRows: FieldHook = ({ value, req, overrideAccess }) =>
  req?.user || overrideAccess || !Array.isArray(value)
    ? value
    : value.filter((row) => !(row as Doc)?.pending)
