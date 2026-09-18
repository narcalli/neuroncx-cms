import { getClientSideURL } from './getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * For local paths (e.g. `/api/media/file/image.webp`) we resolve to absolute
 * URLs in runtime environments like Amplify, where Next.js image optimization
 * cannot self-fetch from localhost in serverless functions.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  let resolvedURL = url

  if (url.startsWith('/')) {
    const baseURL = getClientSideURL() || process.env.NEXT_PUBLIC_SERVER_URL || ''

    if (baseURL) {
      resolvedURL = new URL(url, baseURL).toString()
    }
  }

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  if (!cacheTag) return resolvedURL

  const separator = resolvedURL.includes('?') ? '&' : '?'
  return `${resolvedURL}${separator}${cacheTag}`
}
