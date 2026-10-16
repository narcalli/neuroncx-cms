import type { CollectionBeforeChangeHook, Validate } from 'payload'
import { relationship as validateRelationship } from 'payload/shared'

import { publishing, requiredForOwnPage, isEmptyText } from '../../fields/validators/ownPage'
import { checkPlainText } from '../../fields/validators/plainText'
import { SLUG_PATTERN, type SlugClash, slugFreeInAll } from '../../fields/validators/slugFree'
import { autoRowDescription } from '../../hooks/autoRowDescription'
import { metaWithFallbacks } from '../../hooks/metaFallbacks'

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
 * Micro-app beforeChange: the SEO fallbacks, as on integration items, and
 * waLink. Collection hooks run before field validation, so a filled
 * fallback counts when the publish checks run.
 */
export const microAppFallbacks: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  // Partial updates (scripts) carry only some fields; read the rest from the saved document.
  const cur: Doc = { ...originalDoc, ...data }
  data.meta = metaWithFallbacks(cur, data, originalDoc)
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
 * checked by microAppSlugRule. Empty until microAppsMaster exists.
 *
 * To wire it up: add { collection: 'microAppsMaster', name: 'bot swarm
 * master record' } here, and give microAppsMaster's slug rule the reverse
 * check, slugFreeIn('microApps', 'agent'), as integrationsMaster does.
 */
export const MICRO_APPS_SLUG_CLASHES: SlugClash[] = []

/** Agent slug: optional, 60 characters, lowercase with dashes, needed for an own page. */
export const microAppSlugRule: Validate = async (value, options) => {
  const ownPage = await requiredForOwnPage('a slug')(value, options)
  if (ownPage !== true) return ownPage
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
  ['slug', 'Slug'],
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
