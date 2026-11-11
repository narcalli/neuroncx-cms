import type { PayloadRequest, TextFieldSingleValidation } from 'payload'

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
  // A path on this site; "//host" would go to another site.
  if (url.startsWith('/') && !url.startsWith('//')) return true
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
