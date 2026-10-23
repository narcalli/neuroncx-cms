import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

import { cutOnWord } from '../collections/integrations/hooks'
import { plainTextProblem } from '../fields/validators/plainText'
import { defaultLayoutBlocks } from './hubs'
import { ownPageProblems, sectionPublishProblems } from './publishCheck'
import type { ContentCollectionEntry } from './registry'

type Doc = Record<string, any>

const SUFFIX = ' | NeuronCx'

/** "<name> | NeuronCx", 60 characters at most, cut on a whole word. */
export const fallbackTitle = (name: string): string =>
  `${cutOnWord(name, 60 - SUFFIX.length)}${SUFFIX}`

/** Plain text that fits, or undefined. A WhatsApp field never gets text it would reject. */
const plainFit = (text: unknown, max: number): string | undefined => {
  if (typeof text !== 'string' || !text.trim()) return undefined
  const cut = cutOnWord(text, max)
  return cut && !plainTextProblem(cut) ? cut : undefined
}

/** Which of the factory's tabs a collection has, so fallbacks only fill fields that exist. */
export type FallbackScope = { seo: boolean; whatsapp: boolean }

/**
 * beforeChange: fills empty fields from the name and summary, and sets
 * waLink (foundation.md section 4.3). Collection hooks run before field
 * validation, so a filled fallback counts when the field checks run.
 */
export const contentFallbacks =
  (entry: ContentCollectionEntry, scope: FallbackScope): CollectionBeforeChangeHook =>
  ({ data, originalDoc }) => {
    // Partial updates carry only some fields; read the rest from the saved entry.
    const cur: Doc = { ...originalDoc, ...data }

    if (scope.seo) {
      const meta: Doc = { ...originalDoc?.meta, ...data.meta }
      if (!meta.title && cur.name) meta.title = fallbackTitle(String(cur.name))
      if (!meta.description && cur.summary) meta.description = cutOnWord(String(cur.summary), 155)
      data.meta = meta
    }

    if (scope.whatsapp) {
      // The whole name or nothing: a name cut short ("Test matching and")
      // reads as a mistake in a menu, so a long one waits for an editor.
      if (!cur.waRowTitle && typeof cur.name === 'string' && cur.name.trim().length <= 24) {
        const title = plainFit(cur.name, 24)
        if (title) data.waRowTitle = title
      }
      if (!cur.waRowDescription) {
        const description = plainFit(cur.summary, 70)
        if (description) data.waRowDescription = description
      }
      // The entry's own page, else its place on the hub. Cards-only
      // collections have neither.
      const slug = typeof cur.slug === 'string' && cur.slug ? cur.slug : null
      data.waLink =
        entry.route && slug
          ? cur.hasOwnPage
            ? `${entry.route}/${slug}`
            : `${entry.route}#${slug}`
          : null
    }

    return data
  }

/**
 * beforeChange, first: while the entry follows the page defaults, its stored
 * layout is the default, so the read-only field shows what the page draws.
 * The website and the publish check read the default itself, not this copy.
 */
export const followPageDefaults =
  (entry: ContentCollectionEntry): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const cur: Doc = { ...originalDoc, ...data }
    if (cur.usePageDefaults !== false) data.layout = await defaultLayoutBlocks(entry, req)
    return data
  }

/**
 * beforeChange, after the fallbacks: refuses to publish an entry with Own
 * page on until its page fields are filled. Drafts always save.
 */
export const contentPublishCheck =
  (entry: ContentCollectionEntry): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const cur: Doc = { ...originalDoc, ...data, meta: { ...originalDoc?.meta, ...data.meta } }
    if (cur._status !== 'published' || !cur.hasOwnPage) return data

    const problems = [...ownPageProblems(cur), ...(await sectionPublishProblems(entry, cur, req))]
    if (problems.length) {
      throw new ValidationError({ collection: entry.slug, errors: problems })
    }
    return data
  }
