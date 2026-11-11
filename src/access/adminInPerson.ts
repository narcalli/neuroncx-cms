import type { Access } from 'payload'

import { isApiKeyRequest } from './apiKeyRequest'
import { hasRole } from './roles'

/**
 * An admin signed in as themselves: never a key (an API key or an MCP key),
 * not even an admin's. For what a key must never do, because a key is a
 * credential that sits in files and settings, not a person at the admin.
 */
export const adminInPerson: Access = ({ req }) => hasRole(req.user, 'admin') && !isApiKeyRequest(req)

/** A content owner or admin signed in as themselves, never a key. */
export const ownerOrAdminInPerson: Access = ({ req }) => hasRole(req.user, 'admin', 'contentOwner') && !isApiKeyRequest(req)
