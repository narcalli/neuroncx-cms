import type { CollectionBeforeOperationHook, GlobalBeforeOperationHook } from 'payload'
import { publicError } from '@/utilities/publicError'

/**
 * PAYLOAD INTERNALS (payload 3.84.1, collections/operations/utilities/update.js
 * and globals/operations/update.js): an update sent with unpublishAllLocales
 * skips every field validation, on the grounds that an unpublish only changes
 * the status. With no localization, Payload does not force the status back to
 * draft either, so anything sent with it was saved unchecked: an author or an
 * API key could publish (the _status validator never ran) or save values the
 * other validators refuse. Payload's own Unpublish button sends it with a body
 * of only { _status: 'draft' }, so that is all it may carry here.
 */

export const UNPUBLISH_ONLY_MESSAGE = 'An unpublish request can only set the status to draft. Save any other change separately.'

const isSet = (value: unknown): boolean => value === true || value === 'true'

const onlyDraftStatus = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  const keys = Object.keys(data)
  return keys.length === 1 && keys[0] === '_status' && (data as { _status?: unknown })._status === 'draft'
}

const refuse = (args: { unpublishAllLocales?: unknown; data?: unknown }) => {
  if (isSet(args.unpublishAllLocales) && !onlyDraftStatus(args.data)) throw publicError(UNPUBLISH_ONLY_MESSAGE, 400)
}

/** beforeOperation on every collection. */
export const unpublishOnlyCollection: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation === 'update') refuse(args as { unpublishAllLocales?: unknown; data?: unknown })
  return args
}

/** beforeOperation on every global. */
export const unpublishOnlyGlobal: GlobalBeforeOperationHook = ({ args, operation }) => {
  if (operation === 'update') refuse(args as { unpublishAllLocales?: unknown; data?: unknown })
  return args
}
