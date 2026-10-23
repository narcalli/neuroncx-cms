import type { PayloadRequest } from 'payload'

import { heroDesignOf, HERO_DESIGN_NAMES, type HeroDesignName } from '../fields/heroDesign'
import { sectionKeysIn } from '../fields/layout'
import { defaultLayoutBlocks } from './hubs'
import type { ContentCollectionEntry } from './registry'
import { getSection } from './sections/defineSection'

type Doc = Record<string, any>

/** A field that must be filled before the entry can be published. */
export type PublishProblem = { path: string; message: string }

const empty = (v: unknown) => typeof v !== 'string' || !v.trim()

/** Rows of an array field with every one of the given fields filled. */
const filledRows = (rows: unknown, keys: string[]): number =>
  Array.isArray(rows) ? rows.filter((r) => r && keys.every((k) => !empty(r[k]))).length : 0

/**
 * What the entry's hero design needs (fields_reference.md section 4):
 * Conversation at least 2 chat messages, Picture on the right a picture,
 * Stats at least 2 stats. An entry with no design uses the collection's
 * default.
 */
export const heroDesignProblems = (
  doc: Doc,
  allowed: readonly HeroDesignName[] = HERO_DESIGN_NAMES,
): PublishProblem[] => {
  const design = heroDesignOf(doc, allowed)
  if (design === 'conversation' && filledRows(doc.heroChat, ['text']) < 2) {
    return [{ path: 'heroChat', message: 'Add at least 2 chat messages for the Conversation hero, or pick another hero design.' }]
  }
  if (design === 'rightPlacement' && !doc.heroMedia) {
    return [{ path: 'heroMedia', message: 'Add a hero picture for the Picture on the right hero, or pick another hero design.' }]
  }
  if (design === 'stats' && filledRows(doc.heroStats, ['value', 'label']) < 2) {
    return [{ path: 'heroStats', message: 'Add at least 2 stats for the Stats hero, or pick another hero design.' }]
  }
  return []
}

/**
 * What every entry with Own page on needs before it is published
 * (foundation.md section 4.3), with what its hero design needs.
 * `doc` is the saved entry merged with the incoming change, after the
 * fallbacks have run.
 */
export const ownPageProblems = (
  doc: Doc,
  heroDesigns: readonly HeroDesignName[] = HERO_DESIGN_NAMES,
): PublishProblem[] => {
  const problems: PublishProblem[] = [...heroDesignProblems(doc, heroDesigns)]
  if (empty(doc.heroHeading)) {
    problems.push({ path: 'heroHeading', message: 'Add a hero heading before publishing with Own page on.' })
  }
  if (empty(doc.meta?.title)) {
    problems.push({ path: 'meta.title', message: 'Add an SEO title before publishing with Own page on.' })
  }
  if (empty(doc.meta?.description)) {
    problems.push({
      path: 'meta.description',
      message: 'Add an SEO description before publishing with Own page on.',
    })
  }
  return problems
}

const filled = (v: unknown): boolean =>
  typeof v === 'string' ? Boolean(v.trim()) : Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined

/**
 * The sections an entry page draws: the collection's default layout while
 * usePageDefaults is on (or not yet set), else the entry's own layout,
 * without hidden rows.
 */
export const effectiveSectionKeys = async (
  entry: ContentCollectionEntry,
  doc: Doc,
  req?: Partial<PayloadRequest>,
): Promise<string[]> =>
  sectionKeysIn(doc.usePageDefaults !== false ? await defaultLayoutBlocks(entry, req) : doc.layout)

/**
 * The required fields of every section in the entry's effective layout
 * (foundation.md section 5.2). Runs only while Own page is on, after
 * ownPageProblems. Fields of sections that are not in the layout are not
 * required.
 */
export const sectionPublishProblems = async (
  entry: ContentCollectionEntry,
  doc: Doc,
  req?: Partial<PayloadRequest>,
): Promise<PublishProblem[]> => {
  const problems = new Map<string, PublishProblem>()
  for (const key of await effectiveSectionKeys(entry, doc, req)) {
    const section = getSection(key)
    for (const field of section?.requiredWhenOn ?? []) {
      if (!filled(doc[field]) && !problems.has(field)) {
        problems.set(field, {
          path: field,
          message: `Needed to publish while the ${section!.label} section is on the page.`,
        })
      }
    }
  }
  return [...problems.values()]
}
