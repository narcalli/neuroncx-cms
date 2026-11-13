import type { CollectionBeforeChangeHook, PayloadRequest, TextFieldSingleValidation } from 'payload'

/**
 * Where a custom redirect may send visitors: a path on this site, or a full
 * https address on the site itself or on a host listed in Content standards
 * (Redirect destinations). Anything else would let a redirect on neuroncx.in
 * send visitors to any website.
 */
const ownHosts = (): string[] => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://neuroncx.in').hostname.toLowerCase()
    return [host, host.startsWith('www.') ? host.slice(4) : `www.${host}`]
  } catch {
    return []
  }
}

const listedHosts = async (req: PayloadRequest): Promise<string[]> => {
  const standards = await req.payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true, req }).catch(() => null)
  const rows = (standards as { redirectHosts?: { host?: string }[] } | null)?.redirectHosts ?? []
  return rows.map((r) => String(r.host || '').trim().toLowerCase()).filter(Boolean)
}

export const PATH_OR_HTTPS_MESSAGE = 'Use a path on this site, such as /contact, or a full https address.'

export const validateRedirectDestination: TextFieldSingleValidation = async (value, { req, siblingData }) => {
  if ((siblingData as { type?: string } | undefined)?.type !== 'custom') return true
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return 'Add the address to send visitors to.'
  // A path on this site. "//host" and "/\host" go to another site (browsers
  // read a backslash as a slash), so no second slash, backslash or space.
  if (url.startsWith('/')) return /^\/(?![/\\])[^\s\\]*$/.test(url) ? true : PATH_OR_HTTPS_MESSAGE
  let host: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return PATH_OR_HTTPS_MESSAGE
    host = parsed.hostname.toLowerCase()
  } catch {
    return PATH_OR_HTTPS_MESSAGE
  }
  if (ownHosts().includes(host)) return true
  if (req?.payload && (await listedHosts(req)).includes(host)) return true
  return `${host} is not a listed redirect destination. Redirects to other websites need the host in Content standards (Redirect destinations), added by an admin.`
}

/**
 * beforeChange on redirects: only the destination its type uses is kept. The
 * address is checked only for a custom redirect, but was saved whatever the
 * type, and the website follows an address before a page reference, so a
 * "page" redirect carrying an address went wherever the address said.
 */
export const keepOneDestination: CollectionBeforeChangeHook = ({ data }) => {
  const to = data?.to as { type?: string; url?: unknown; reference?: unknown } | undefined
  if (!to) return data
  if (to.type === 'custom') to.reference = null
  else to.url = null
  return data
}
