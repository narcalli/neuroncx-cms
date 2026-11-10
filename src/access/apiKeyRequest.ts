import type { PayloadRequest } from 'payload'

// 'api-key': a REST API key, of a user or an MCP key. 'mcp-api-key': the MCP
// endpoint, which signs in as the key's owner in users, so the collection of
// req.user cannot tell an MCP request from a person.
const API_KEY_STRATEGIES = new Set(['api-key', 'mcp-api-key'])

/**
 * True when the request signed in with an API key rather than as a person.
 * Checks how the request authenticated, not which collection the user is in,
 * so it also holds for key collections added later.
 */
export const isApiKeyRequest = ({ user }: Pick<PayloadRequest, 'user'>): boolean => {
  // Payload sets _strategy on the signed-in user; the generated User type leaves it out.
  const strategy = user && '_strategy' in user ? user._strategy : undefined
  return typeof strategy === 'string' && API_KEY_STRATEGIES.has(strategy)
}
