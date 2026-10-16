import type { CollectionSlug, PayloadRequest } from 'payload'

type Doc = Record<string, any>

/** Lowercase letters, numbers and single dashes, for example docpulse or book-and-get-paid. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Refuses a slug that a record in another collection already uses, so two
 * collections that share an address space (a hub and its entries) never
 * collide. `otherName` is how the error names that collection's records.
 */
export const slugFreeIn =
  (other: CollectionSlug, otherName: string) =>
  async (value: unknown, req: PayloadRequest): Promise<true | string> => {
    if (typeof value !== 'string' || !value) return true
    const found = await req.payload.find({
      collection: other,
      where: { slug: { equals: value } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const clash = found.docs[0] as Doc | undefined
    return clash
      ? `The ${otherName} "${clash.name}" already uses the slug ${value}. Choose another one.`
      : true
  }

/** One collection whose slugs another must not reuse, with how errors name its records. */
export type SlugClash = { collection: CollectionSlug; name: string }

/** Checks a slug against every collection in the list, stopping at the first clash. */
export const slugFreeInAll = async (
  clashes: SlugClash[],
  value: unknown,
  req: PayloadRequest,
): Promise<true | string> => {
  for (const c of clashes) {
    const result = await slugFreeIn(c.collection, c.name)(value, req)
    if (result !== true) return result
  }
  return true
}
