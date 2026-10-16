import type { CollectionBeforeChangeHook, CollectionSlug } from 'payload'
import { ValidationError } from 'payload'

type Doc = Record<string, any>

/**
 * A beforeChange hook that lets only one record in the collection have
 * Is main on (field `isMain`), drafts included. The error names the record
 * that already has it.
 */
export const oneMainRecord =
  (collection: CollectionSlug): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const isMain = data.isMain ?? originalDoc?.isMain
    if (!isMain) return data
    const others = await req.payload.find({
      collection,
      where: {
        and: [
          { isMain: { equals: true } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const holder = others.docs[0] as Doc | undefined
    if (holder) {
      throw new ValidationError({
        collection,
        errors: [
          {
            path: 'isMain',
            message: `"${holder.name}" is already the main record. Turn Is main off there first.`,
          },
        ],
        req,
      })
    }
    return data
  }
