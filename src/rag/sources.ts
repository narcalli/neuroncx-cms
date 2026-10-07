import type { RagSource } from './types'

const TENANT = 'ncx'

export const ragSources: Record<string, RagSource> = {
  pages: {
    collection: 'pages',
    shouldIndex: (d) => d._status === 'published' && Boolean(d.slug),
    tenantOf: () => TENANT,
    visibility: () => 'public',
    urlOf: (d) => (d.slug === 'home' ? '/' : `/${d.slug}`),
    // placeholder. Real block serializers land after the wiring is proven.
    project: (d) => ({
      title: d.title,
      sections: [{ heading: 'Summary', body: d.meta?.description ?? '' }],
    }),
  },

  posts: {
    collection: 'posts',
    shouldIndex: (d) => d._status === 'published' && Boolean(d.slug),
    tenantOf: () => TENANT,
    visibility: () => 'public',
    urlOf: (d) => `/posts/${d.slug}`,
    project: (d) => ({
      title: d.title,
      sections: [{ heading: 'Summary', body: d.meta?.description ?? '' }],
    }),
    metadataOf: (d) => ({
      categories: (d.categories ?? []).map((c: any) =>
        typeof c === 'object' ? (c.slug ?? c.title) : String(c),
      ),
      publishedAt: d.publishedAt ? new Date(d.publishedAt).getTime() : undefined,
    }),
  },
}

export const isRagSource = (slug: string): boolean => slug in ragSources
