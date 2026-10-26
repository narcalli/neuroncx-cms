import type { CollectionAfterChangeHook } from 'payload'

import { resolvePagePath } from '../Pages/nesting'
import { revalidateContent } from '../../content/revalidate'

type FlowDemoBlock = {
  blockType?: string
  mode?: string | null
  agentsFor?: string | null
  industries?: string[] | null
  hidden?: boolean | null
}

const MAX_PATHS = 50

/**
 * Whether an Agentic Flow Demo shows agents with these verticals: in Agent
 * features mode, for all agents, or for chosen industries that include at
 * least one of them. A hidden block shows nothing.
 */
export const flowDemoShows = (block: FlowDemoBlock, verticals: readonly string[]): boolean => {
  if (block?.blockType !== 'agenticFlowDemo' || block.mode !== 'agentFeatures' || block.hidden) return false
  const chosen = block.agentsFor === 'industries' ? (block.industries ?? []) : []
  return !chosen.length || chosen.some((v) => verticals.includes(v))
}

/**
 * afterChange on an agent: when it is published, or was before this change,
 * the published pages whose Agentic Flow Demo shows it, with its verticals
 * before or after the change. The agent's own page and its hub are refreshed
 * by the factory (content/revalidate.ts); hubs that hold the block are among
 * those hubs.
 */
export const revalidateFlowDemoPages: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const now = doc?._status === 'published'
  const before = previousDoc?._status === 'published'
  if (!now && !before) return doc
  const verticals = [...new Set([...(now ? (doc.verticals ?? []) : []), ...(before ? (previousDoc.verticals ?? []) : [])])]

  const { docs } = await req.payload.find({
    collection: 'pages',
    where: { and: [{ 'layout.blockType': { equals: 'agenticFlowDemo' } }, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const paths: string[] = []
  for (const page of docs) {
    if (!(page.layout ?? []).some((b) => flowDemoShows(b as FlowDemoBlock, verticals))) continue
    const path = await resolvePagePath(req, page as any)
    if (path) paths.push(path)
  }
  if (!paths.length) return doc
  await revalidateContent({
    collection: 'pages',
    paths: [...new Set(paths)].slice(0, MAX_PATHS),
    reason: `agent ${doc.slug ?? doc.id} ${now ? 'published or updated' : 'unpublished'}`,
    logger: req.payload?.logger,
  })
  return doc
}
