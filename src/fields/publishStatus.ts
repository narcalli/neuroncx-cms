import type { SelectField, SelectFieldSingleValidation } from 'payload'
import { select } from 'payload/shared'

import { isApiKeyRequest } from '@/access/apiKeyRequest'
import { canPublish, inReviewScope, REVIEW_PUBLISH_MESSAGE, reviewWorkflowOn } from '@/review/scope'

export const API_KEY_PUBLISH_MESSAGE =
  'Publishing needs a person signed in to the admin. API keys, including MCP keys, can save drafts only.'

/**
 * Refuses _status 'published' from an API-key request (src/access/apiKeyRequest.ts),
 * and, while the review workflow is on (src/review/scope.ts), from an author on
 * the collections it covers; then runs Payload's own select check. Payload
 * validates only when publishing, not on draft saves, so drafts still save. A
 * publish with nobody signed in (a script) is not affected; a scheduled publish
 * runs as the person who scheduled it, so an author's is refused too.
 */
export const noPublishWithApiKey: SelectFieldSingleValidation = async (value, options) => {
  if (value === 'published' && isApiKeyRequest(options.req)) return API_KEY_PUBLISH_MESSAGE
  const { req, collectionSlug } = options
  if (value === 'published' && req?.payload && req.user && inReviewScope(collectionSlug) && !canPublish(req.user) && (await reviewWorkflowOn(req))) {
    return REVIEW_PUBLISH_MESSAGE
  }
  return select(value, options)
}

/**
 * Added to a collection with drafts, Payload merges this into its own _status
 * field (mergeBaseFields), keeping its label, default and hidden input and adding
 * noPublishWithApiKey. options is empty on purpose: the merge appends it to
 * Payload's Draft and Published, so empty keeps exactly those two.
 */
export const publishStatusField = (): SelectField => ({
  name: '_status',
  type: 'select',
  options: [],
  validate: noPublishWithApiKey,
})
