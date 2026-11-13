import { APIError } from 'payload'

/**
 * An APIError whose message reaches the person who made the request. The
 * production build empties class names, so an APIError's name (taken from
 * its class) comes out blank, and Payload answers an error with no name and
 * no data with "An unknown error occurred." instead of its message
 * (payload 3.84.1, utilities/formatErrors.js). Seen live on 13 Nov 2026.
 */
export const publicError = (message: string, status: number): APIError => {
  const error = new APIError(message, status, null, true)
  error.name = 'APIError'
  return error
}
