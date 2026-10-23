import { timingSafeEqual } from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { getContentCollection } from '../content/registry'
import {
  entriesMessage,
  entryMessages,
  fallbackMessages,
  groupsMessage,
  loadEntries,
  loadEntry,
  loadGroup,
  loadGroups,
  loadHub,
  type WaResponse,
} from '../content/whatsapp'

/**
 * GET /api/wa/:collection, what the NCX WhatsApp bot calls for a content
 * collection's menus (foundation.md section 7.4). Read-only.
 *
 *   ?step=groups                     the collection's groupings as a list
 *   ?step=entries&group=<slug>       that grouping's entries, 10 at most
 *   ?step=entry&slug=<slug>          one entry
 *
 * A collection without a grouping skips the first step: groups returns the
 * entries list. Anything not found returns the hub's fallback, with found
 * false. Needs WA_API_KEY, sent as the x-api-key header.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const keyMatches = (given: string | null): boolean => {
  const expected = process.env.WA_API_KEY
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const waHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!keyMatches(req.headers.get('x-api-key'))) return json({ error: 'Not allowed' }, 401)

  const collection = String(req.routeParams?.collection ?? '')
  const entry = getContentCollection(collection)
  if (!entry) return json({ error: `No content collection called ${collection}` }, 404)

  const params = req.searchParams
  const step = params.get('step') || 'groups'
  const { payload } = req
  const hub = await loadHub(payload, collection)
  const answer = (body: Omit<WaResponse, 'collection'>) => json({ collection, ...body })
  const notFound = (s: WaResponse['step']) => answer({ step: s, found: false, messages: fallbackMessages(hub) })

  if (step === 'groups' && entry.grouping) {
    const groups = await loadGroups(payload, entry, hub)
    return groups.length
      ? answer({ step: 'groups', found: true, messages: [groupsMessage(entry, hub, groups)] })
      : notFound('groups')
  }

  if (step === 'groups' || step === 'entries') {
    const slug = params.get('group')
    // Without a grouping there is one list of every entry.
    if (!entry.grouping) {
      const docs = await loadEntries(payload, entry)
      return docs.length
        ? answer({ step: 'entries', found: true, messages: [entriesMessage(entry, hub, null, docs)] })
        : notFound('entries')
    }
    const group = slug ? await loadGroup(payload, entry, slug) : null
    if (!group) return notFound('entries')
    const docs = await loadEntries(payload, entry, { [entry.grouping.field]: { equals: group.id } })
    return docs.length
      ? answer({ step: 'entries', found: true, messages: [entriesMessage(entry, hub, group, docs)] })
      : notFound('entries')
  }

  if (step === 'entry') {
    const slug = params.get('slug')
    const doc = slug ? await loadEntry(payload, entry, slug) : null
    return doc ? answer({ step: 'entry', found: true, messages: entryMessages(doc) }) : notFound('entry')
  }

  return json({ error: 'step must be groups, entries or entry' }, 400)
}

export const waEndpoint: Endpoint = { path: '/wa/:collection', method: 'get', handler: waHandler }
