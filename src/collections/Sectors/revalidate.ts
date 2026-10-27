import type { CollectionAfterChangeHook, PayloadRequest, Where } from 'payload'

import { idOf } from '../../content/paths'
import { entryPath, getContentCollection } from '../../content/registry'
import { revalidateContent } from '../../content/revalidate'

/**
 * Refreshing the industry pages a record appears on. An industry page draws
 * agents, integrations, customers and topics through its sections
 * (./sections.ts); when one of those is published, or taken down, the pages
 * that show it are asked to refresh (src/content/revalidate.ts).
 */

type Doc = Record<string, any>

/**
 * The addresses of the published industries with their own page that match
 * `where` and whose layout holds the given section.
 */
export const industryPathsWith = async (req: PayloadRequest, section: string, where: Where): Promise<string[]> => {
  const industries = getContentCollection('sectors')
  if (!industries) return []
  const { docs } = await req.payload.find({
    collection: 'sectors',
    where: { and: [where, { hasOwnPage: { equals: true } }, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: 50,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const blockType = `${section}Section`
  return [
    ...new Set(
      (docs as Doc[])
        .filter((d) => Array.isArray(d.layout) && d.layout.some((b: Doc) => b?.blockType === blockType))
        .map((d) => entryPath(industries, d))
        .filter((p): p is string => Boolean(p)),
    ),
  ]
}

/**
 * afterChange: when the record is published now, or was before this change,
 * refresh the industry pages whose `section` shows it, before or after the
 * change. `whereFor` turns the record's versions into the industries to look
 * at, or null when there are none.
 */
export const revalidateIndustriesShowing =
  (section: string, whereFor: (docs: Doc[]) => Where | null): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    if (req.context?.disableRevalidate) return doc
    const versions = [doc?._status === 'published' ? doc : null, previousDoc?._status === 'published' ? previousDoc : null].filter(
      (d): d is Doc => Boolean(d),
    )
    if (!versions.length) return doc
    const where = whereFor(versions)
    if (!where) return doc
    const paths = await industryPathsWith(req, section, where)
    if (paths.length) {
      await revalidateContent({ collection: 'sectors', paths, reason: `${section} changed (${doc.slug ?? doc.id})`, logger: req.payload?.logger })
    }
    return doc
  }

/** Industries whose verticals share one with the record's (agents, integrations). */
export const byVerticals = (docs: Doc[]): Where | null => {
  const verticals = [...new Set(docs.flatMap((d) => (Array.isArray(d.verticals) ? d.verticals : [])))]
  return verticals.length ? { verticals: { in: verticals } } : null
}

/** The industries a relationship field on the record points to (a customer's sectors, a topic's industry). */
export const byLinked =
  (field: string) =>
  (docs: Doc[]): Where | null => {
    const ids = [...new Set(docs.flatMap((d) => (Array.isArray(d[field]) ? d[field] : [d[field]])).map(idOf).filter((id): id is string => Boolean(id)))]
    return ids.length ? { id: { in: ids } } : null
  }
