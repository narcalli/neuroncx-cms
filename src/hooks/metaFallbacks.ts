import { fallbackMetaTitle } from '@/utilities/fitText'

type Doc = Record<string, any>

/**
 * Fills an empty SEO title and description, for any collection using the
 * shared SEO tab: the title from the primary keyword (or the name), the
 * description from the summary. `cur` is the saved document merged with the
 * incoming data. Returns the meta group to save.
 */
export const metaWithFallbacks = (cur: Doc, data: Doc, originalDoc?: Doc): Doc => {
  const meta: Doc = { ...originalDoc?.meta, ...data.meta }
  if (!meta.title && (cur.primaryKeyword || cur.name)) {
    meta.title = fallbackMetaTitle(String(cur.primaryKeyword || cur.name))
  }
  if (!meta.description && cur.summary) meta.description = cur.summary
  return meta
}
