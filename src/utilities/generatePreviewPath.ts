import { PayloadRequest, CollectionSlug } from 'payload'

// Previously imported from the frontend preview route. Declared here so the
// CMS builds on its own — the website owns the route that consumes these.
export type PreviewSearchParams = {
  slug: string
  collection: string
  path: string
  previewSecret: string
}

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/posts',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  const path = `${collectionPrefixMap[collection]}/${slug}`

  const params: PreviewSearchParams = {
    slug,
    collection,
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  }

  const encodedParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    encodedParams.append(key, value)
  })

  // Preview opens on the website, which is a separate app after the split.
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''

  return `${base}/next/preview?${encodedParams.toString()}`
}
