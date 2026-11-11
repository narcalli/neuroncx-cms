/**
 * PAYLOAD INTERNALS: written against payload 3.84.1. Payload adds its own
 * collections (edit locks, preferences, the migrations log, folders) as it
 * builds the config, after plugins run, with no way to set their access in
 * the config. This sets it on the built config instead, before anything
 * uses it. If an upgrade renames these slugs, the rules here stop applying;
 * tests/int/accessMatrix.int.spec.ts then fails, since it checks every
 * collection's access against its table.
 */
import type { Access, SanitizedConfig } from 'payload'

import { isApiKeyRequest } from './apiKeyRequest'

/** Someone signed in as themselves: never a key. */
const personSignedIn: Access = ({ req }) => Boolean(req.user) && !isApiKeyRequest(req)

/** Only within what the collection's own rule allows, and never for a key. */
const personWithin =
  (own: Access | undefined): Access =>
  async (args) => {
    if (!personSignedIn(args)) return false
    return own ? await own(args) : true
  }

const RULES: Record<string, (access: Record<string, Access | undefined>) => Record<string, Access>> = {
  // "Being edited by": the admin creates and clears these for the person editing.
  'payload-locked-documents': () => ({ create: personSignedIn, read: personSignedIn, update: personSignedIn, delete: personSignedIn }),
  'payload-folders': () => ({ create: personSignedIn, read: personSignedIn, update: personSignedIn, delete: personSignedIn }),
  // One's own preferences only: Payload limits reading and deleting to them, and now changing too.
  'payload-preferences': (access) => ({
    create: personSignedIn,
    read: personWithin(access.read),
    update: personWithin(access.read),
    delete: personWithin(access.delete),
  }),
  // Written by Payload's migration runner, never through the API (REST has no routes; GraphQL did).
  'payload-migrations': () => ({ create: () => false, read: () => false, update: () => false, delete: () => false }),
}

export const restrictInternalCollections = async (built: Promise<SanitizedConfig>): Promise<SanitizedConfig> => {
  const config = await built
  for (const collection of config.collections) {
    const rule = RULES[collection.slug]
    if (rule) collection.access = { ...collection.access, ...rule(collection.access as Record<string, Access | undefined>) }
  }
  return config
}

