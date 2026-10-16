import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  PayloadRequest,
  Where,
} from 'payload'

import { fitNames } from '@/utilities/fitText'

type Doc = Record<string, any>

const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' ? String((v as Doc).id) : v ? String(v) : null

/**
 * The automatic WhatsApp row description for a grouping collection (a
 * category, a family): the names of its published items with the given
 * statuses, in order, fitted to 70 characters on a whole name.
 *
 * Returns three hooks:
 * - parentBeforeChange, on the grouping collection: fills `waRowDescription`
 *   while its `waRowDescriptionAuto` switch is on;
 * - itemAfterChange and itemAfterDelete, on the item collection: refresh the
 *   groups an item was in before and after the change.
 */
export const autoRowDescription = (opts: {
  /** The grouping collection, for example integrationCategories. */
  parent: CollectionSlug
  /** The item collection, for example integrations. */
  items: CollectionSlug
  /** The item field that points at the group, for example category. */
  field: string
  /** Item statuses whose names are listed, for example ['live']. */
  statuses: string[]
  /** How log messages name a group, for example category. */
  noun: string
  /** req.context key set while a refresh runs, so nothing it triggers starts another. */
  flag: string
}) => {
  const statusWhere: Where =
    opts.statuses.length === 1
      ? { status: { equals: opts.statuses[0] } }
      : { status: { in: opts.statuses } }

  const namesIn = async (req: PayloadRequest, parentId: string) => {
    const found = await req.payload.find({
      collection: opts.items,
      where: {
        and: [{ [opts.field]: { equals: parentId } }, { _status: { equals: 'published' } }, statusWhere],
      },
      sort: ['order', 'name'],
      limit: 100,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      req,
    })
    return found.docs.map((d) => String((d as Doc).name))
  }

  const parentBeforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
    const auto = data.waRowDescriptionAuto ?? originalDoc?.waRowDescriptionAuto
    if (!auto) return data
    const id = idOf(originalDoc?.id)
    data.waRowDescription = id ? fitNames(await namesIn(req, id)) : ''
    return data
  }

  const refresh = async (req: PayloadRequest, ids: (string | null)[]) => {
    for (const id of new Set(ids.filter(Boolean) as string[])) {
      try {
        const parent = (await req.payload.findByID({
          collection: opts.parent,
          id,
          depth: 0,
          overrideAccess: true,
          disableErrors: true,
          req,
        })) as Doc | null
        if (!parent?.waRowDescriptionAuto) continue
        const text = fitNames(await namesIn(req, id))
        if (text === (parent.waRowDescription || '')) continue
        // Written through the database adapter, not payload.update. This runs
        // inside the item's own save (its database transaction in
        // production). A full Payload update that failed there would abort that
        // transaction and so the item's save, whatever the catch below does.
        // The adapter write runs no validation and no hooks, so it cannot fail
        // on a rule, cannot start another refresh, leaves the group's status
        // as it is, and adds no new version.
        req.context[opts.flag] = true
        try {
          await req.payload.db.updateOne({
            collection: opts.parent,
            where: { id: { equals: id } },
            data: { waRowDescription: text },
            returning: false,
            req,
          })
          // The admin shows a group's latest saved version, so that gets the
          // same text. If an editor has an open draft, the draft gets it.
          const latest = await req.payload.db.findVersions({
            collection: opts.parent,
            where: { and: [{ parent: { equals: id } }, { latest: { equals: true } }] },
            limit: 1,
            pagination: false,
            req,
          })
          const version = latest.docs[0] as Doc | undefined
          if (version) {
            await req.payload.db.updateVersion({
              collection: opts.parent,
              id: version.id,
              versionData: { ...version, version: { ...version.version, waRowDescription: text } },
              returning: false,
              req,
            })
          }
        } finally {
          delete req.context[opts.flag]
        }
      } catch (err) {
        // A failed refresh must not stop the item from saving.
        req.payload.logger.error({ err, msg: `Could not refresh ${opts.noun} ${id}` })
      }
    }
  }

  const itemAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (req.context?.[opts.flag]) return doc
    await refresh(req, [idOf(doc?.[opts.field]), idOf(previousDoc?.[opts.field])])
    return doc
  }

  const itemAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (req.context?.[opts.flag]) return doc
    await refresh(req, [idOf(doc?.[opts.field])])
    return doc
  }

  return { parentBeforeChange, itemAfterChange, itemAfterDelete }
}
