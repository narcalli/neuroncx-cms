import type { Block, CollectionSlug, Endpoint, Field, PayloadRequest } from 'payload'

/**
 * What to warn about before rolling back to a version: a different address,
 * and links to media or entries that no longer exist. Shown in the History
 * tab's confirmation; the rollback itself is Payload's restore as a draft.
 */

export type Ref = { collection: string; id: string; label: string }

export type RollbackCheck = {
  /** The version's address (slug), when it differs from the current one. */
  slug: { from: string | null; to: string | null } | null
  /** Pages only: the version sits under a different parent page. */
  parentChanged: boolean
  missing: { label: string; collection: string; count: number }[]
}

const labelOf = (field: { name?: string; label?: unknown }): string => {
  const { label, name } = field
  if (typeof label === 'string' && label) return label
  if (label && typeof label === 'object' && typeof (label as Record<string, unknown>).en === 'string') {
    return (label as Record<string, string>).en
  }
  return name || ''
}

const idOf = (v: unknown): string | null => {
  if (typeof v === 'string' && v) return v
  if (typeof v === 'number') return String(v)
  if (v && typeof v === 'object' && 'id' in v) return idOf((v as { id: unknown }).id)
  return null
}

/** Every relationship and upload value in a version, with the field it sits in. */
export const collectRefs = (
  fields: Field[],
  data: Record<string, unknown> | null | undefined,
  blocks: Record<string, Block>,
  out: Ref[] = [],
): Ref[] => {
  if (!data || typeof data !== 'object') return out
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible' || (field.type === 'group' && !('name' in field && field.name))) {
      collectRefs(field.fields, data, blocks, out)
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        collectRefs(tab.fields, 'name' in tab && tab.name ? (data[tab.name] as Record<string, unknown>) : data, blocks, out)
      }
      continue
    }
    if (!('name' in field) || !field.name) continue
    const value = data[field.name]
    if (value === undefined || value === null) continue
    if (field.type === 'group') collectRefs(field.fields, value as Record<string, unknown>, blocks, out)
    else if (field.type === 'array') {
      for (const row of Array.isArray(value) ? value : []) collectRefs(field.fields, row, blocks, out)
    } else if (field.type === 'blocks') {
      for (const row of Array.isArray(value) ? value : []) {
        const slug = (row as { blockType?: string })?.blockType
        const block =
          ([...(field.blocks || []), ...(field.blockReferences || [])].find(
            (b) => typeof b !== 'string' && b.slug === slug,
          ) as Block | undefined) ?? (slug ? blocks[slug] : undefined)
        if (block) collectRefs(block.fields, row, blocks, out)
      }
    } else if (field.type === 'relationship' || field.type === 'upload') {
      const values = Array.isArray(value) ? value : [value]
      for (const v of values) {
        if (v && typeof v === 'object' && 'relationTo' in v) {
          const id = idOf((v as { value: unknown }).value)
          if (id) out.push({ collection: String((v as { relationTo: string }).relationTo), id, label: labelOf(field) })
        } else if (typeof field.relationTo === 'string') {
          const id = idOf(v)
          if (id) out.push({ collection: field.relationTo, id, label: labelOf(field) })
        }
      }
    }
  }
  return out
}

/** The references that no longer exist, grouped by field and collection. */
export const missingRefs = async (req: PayloadRequest, refs: Ref[]): Promise<RollbackCheck['missing']> => {
  const byCollection = new Map<string, Set<string>>()
  for (const r of refs) {
    if (!byCollection.has(r.collection)) byCollection.set(r.collection, new Set())
    byCollection.get(r.collection)!.add(r.id)
  }
  const gone = new Set<string>()
  for (const [collection, ids] of byCollection) {
    if (!req.payload.collections[collection as CollectionSlug]) continue
    const found = await req.payload.db.find({
      collection: collection as CollectionSlug,
      where: { id: { in: [...ids] } },
      limit: ids.size,
      pagination: false,
      req,
    })
    const present = new Set(found.docs.map((d) => String(d.id)))
    for (const id of ids) if (!present.has(id)) gone.add(`${collection}:${id}`)
  }
  const counts = new Map<string, { label: string; collection: string; count: number }>()
  for (const r of refs) {
    if (!gone.has(`${r.collection}:${r.id}`)) continue
    const key = `${r.label}|${r.collection}`
    const c = counts.get(key) ?? { label: r.label, collection: r.collection, count: 0 }
    c.count += 1
    counts.set(key, c)
  }
  return [...counts.values()]
}

/** GET /api/{collection}/:id/rollback-check?version=<versionId>, for signed-in editors. */
export const rollbackCheckEndpoint = (slug: string): Endpoint => ({
  path: '/:id/rollback-check',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Sign in first.' }, { status: 401 })
    const collection = req.payload.collections[slug as CollectionSlug]?.config
    const id = String(req.routeParams?.id ?? '')
    const versionId = String(req.searchParams.get('version') ?? '')
    if (!collection || !id || !versionId) return Response.json({ error: 'Missing version.' }, { status: 400 })
    try {
      const version = (await req.payload.findVersionByID({
        collection: collection.slug as any,
        id: versionId,
        depth: 0,
        overrideAccess: false,
        req,
      })) as unknown as { parent?: unknown; version: Record<string, unknown> }
      if (idOf(version.parent) !== id) return Response.json({ error: 'That version is not of this entry.' }, { status: 400 })
      const current = (await req.payload.findByID({
        collection: collection.slug as any,
        id,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
      })) as Record<string, unknown>
      const blocks = Object.fromEntries((req.payload.config.blocks || []).map((b) => [b.slug, b as Block]))
      const was = (version.version.slug as string | undefined) ?? null
      const now = (current.slug as string | undefined) ?? null
      const result: RollbackCheck = {
        slug: was !== now && (was || now) ? { from: now, to: was } : null,
        parentChanged: collection.slug === 'pages' && idOf(version.version.parent) !== idOf(current.parent),
        missing: await missingRefs(req, collectRefs(collection.fields, version.version, blocks)),
      }
      return Response.json(result)
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 404 })
    }
  },
})
