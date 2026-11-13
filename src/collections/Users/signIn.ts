import type { CollectionBeforeOperationHook } from 'payload'

import { adminInPerson } from '../../access/adminInPerson'
import { isApiKeyRequest } from '../../access/apiKeyRequest'
import { publicError } from '@/utilities/publicError'

/**
 * A key (an API key or an MCP key) is not a sign-in, and must not be able to
 * get one. Before 11 Nov 2026 a key could create a user with a password, or
 * set a new password on its own owner, then sign in with it: a full session,
 * which went round the rules that keys save drafts only and that authors
 * need review to publish.
 */

/** New users: an admin, signed in as themselves. */
export const signedInAdmin = adminInPerson

const SIGN_IN_FIELDS = ['password', 'email', 'enableAPIKey', 'apiKey'] as const

export const KEY_SIGN_IN_MESSAGE =
  'An API key cannot change a password, an email address or API key settings. Sign in to the admin to change them.'

/** beforeOperation: refuses a key's change to anyone's sign-in details, its own owner's included. */
export const keysCannotChangeSignIn: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'update' || !isApiKeyRequest(req)) return args
  const data = (args as { data?: Record<string, unknown> }).data ?? {}
  if (SIGN_IN_FIELDS.some((f) => f in data)) throw publicError(KEY_SIGN_IN_MESSAGE, 403)
  return args
}
