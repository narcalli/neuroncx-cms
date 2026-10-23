import type { PayloadRequest } from 'payload'

import { sectionKeysIn } from '../fields/layout'
import { defaultLayoutBlocks } from './hubs'
import type { ContentCollectionEntry } from './registry'
import { getSection } from './sections/defineSection'

type Doc = Record<string, any>

/** A field that must be filled before the entry can be published. */
export type PublishProblem = { path: string; message: string }

const empty = (v: unknown) => typeof v !== 'string' || !v.trim()

/**
 * What every entry with Own page on needs before it is published
 * (foundation.md section 4.3). `doc` is the saved entry merged with the
 * incoming change, after the fallbacks have run.
 */
export const ownPageProblems = (doc: Doc): PublishProblem[] => {
  const problems: PublishProblem[] = []
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
