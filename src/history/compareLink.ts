import type { PayloadRequest } from 'payload'

/**
 * Payload's version comparison for an entry's newest version against the
 * version visitors see now: the comparison a reviewer needs. Null when the
 * entry is not published, or nothing has been saved since it was.
 * Lookups pass pagination: false, as they may run inside a save.
 */
export const compareWithLivePath = async (req: PayloadRequest, collection: string, id: string): Promise<string | null> => {
  const stored = await req.payload.db.findOne<{ id: string; _status?: string }>({ collection: collection as never, where: { id: { equals: id } }, req })
  if (stored?._status !== 'published') return null
  const versions = (where: Record<string, unknown>) =>
    req.payload.findVersions({
      collection: collection as never,
      where: { and: [{ parent: { equals: id } }, where] } as never,
      sort: '-updatedAt',
      limit: 1,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
  const newest = (await versions({})).docs[0]
  const live = (await versions({ 'version._status': { equals: 'published' } })).docs[0]
  if (!newest || !live || String(newest.id) === String(live.id)) return null
  return `${req.payload.config.routes.admin}/collections/${collection}/${id}/versions/${newest.id}?versionFrom=${live.id}`
}
