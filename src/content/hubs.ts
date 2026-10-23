import type { PayloadRequest } from 'payload'

import { layoutBlocksFor } from '../fields/layout'
import type { ContentCollectionEntry } from './registry'
import { sectionForBlockType } from './sections/defineSection'

type Block = Record<string, unknown> & { blockType?: string }

/**
 * The published hub record for a collection, or null. Drafts of a hub never
 * change what entry pages draw.
 */
export const findPublishedHub = async (
  req: Partial<PayloadRequest> | undefined,
  collection: string,
): Promise<Record<string, any> | null> => {
  if (!req?.payload?.find) return null
  const found = await req.payload.find({
    collection: 'hubs',
    where: {
      and: [{ forCollection: { equals: collection } }, { _status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req: req as PayloadRequest,
  })
  return (found.docs[0] as Record<string, any>) ?? null
}

/**
 * The layout an entry follows while usePageDefaults is on: the published
 * hub's defaultLayout, sections only, else the collection's own default from
 * its config. Rows come without ids, so a copy gets new ones.
 */
export const defaultLayoutBlocks = async (
  entry: ContentCollectionEntry,
  req: Partial<PayloadRequest> | undefined,
): Promise<Block[]> => {
  const hub = await findPublishedHub(req, entry.slug)
  const fromHub = ((hub?.defaultLayout ?? []) as Block[])
    .filter((block) => entry.sections.includes(sectionForBlockType(block?.blockType)?.key ?? ''))
    .map(({ id: _id, ...block }) => block)
  return fromHub.length ? fromHub : layoutBlocksFor(entry.defaultLayout)
}
