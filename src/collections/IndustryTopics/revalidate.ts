import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest, Where } from 'payload'

import { idOf } from '../../content/paths'
import { entryPath, getContentCollection } from '../../content/registry'
import { revalidateContent } from '../../content/revalidate'

/**
 * Refreshing the pages a topic shows on besides its own (the factory
 * refreshes that, src/content/revalidate.ts): its industry's page, which
 * lists its topics and is the "Back to" link of their cluster footer, and
 * its sibling topics' pages, whose "Next stage" link may now point at it or
 * past it. Both before and after a change, so a move to another industry
 * refreshes both families.
 */

type Doc = Record<string, any>

const published = (d: Doc | null | undefined): d is Doc => d?._status === 'published'

/** The published pages of the given industries, and of their topics other than this one. */
export const topicFamilyPaths = async (req: PayloadRequest, industryIds: string[], topicId: string | null): Promise<string[]> => {
  const industries = getContentCollection('sectors')
  const topics = getContentCollection('industryTopics')
  if (!industryIds.length || !industries || !topics) return []
  const common = { depth: 0, limit: 100, pagination: false, overrideAccess: true, req } as const
  const shown: Where[] = [{ hasOwnPage: { equals: true } }, { _status: { equals: 'published' } }]
  const [own, siblings] = await Promise.all([
    req.payload.find({ ...common, collection: 'sectors', where: { and: [{ id: { in: industryIds } }, ...shown] } }),
    req.payload.find({
      ...common,
      collection: 'industryTopics',
      where: { and: [{ industry: { in: industryIds } }, ...shown, ...(topicId ? [{ id: { not_equals: topicId } } as Where] : [])] },
    }),
  ])
  return [
    ...new Set(
      [...(own.docs as Doc[]).map((d) => entryPath(industries, d)), ...(siblings.docs as Doc[]).map((d) => entryPath(topics, d))].filter(
        (p): p is string => Boolean(p),
      ),
    ),
  ]
}

const refresh = async (req: PayloadRequest, versions: Doc[], doc: Doc, reason: string) => {
  const industryIds = [...new Set(versions.map((v) => idOf(v.industry)).filter((id): id is string => Boolean(id)))]
  const paths = await topicFamilyPaths(req, industryIds, doc.id ? String(doc.id) : null)
  if (paths.length) {
    await revalidateContent({ collection: 'industryTopics', paths, reason: `${reason} (${doc.slug ?? doc.id})`, logger: req.payload?.logger })
  }
}

/** afterChange: when the topic is published now, or was before this change. */
export const revalidateTopicFamily: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const versions = [doc, previousDoc].filter(published)
  if (versions.length) await refresh(req, versions, doc, 'topic changed')
  return doc
}

/** afterDelete: its industry and siblings, had it been published. */
export const revalidateTopicFamilyAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  if (published(doc)) await refresh(req, [doc], doc, 'topic deleted')
  return doc
}
