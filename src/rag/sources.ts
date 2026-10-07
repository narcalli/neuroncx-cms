// src/rag/sources.ts
import type { RagSource } from './types'
import { richTextToMarkdown } from './normalize'

export const ragSources: Record<string, RagSource> = {
  doctors: {
    collection: 'doctors',
    shouldIndex: (d) => d._status === 'published' && d.tenant != null,
    tenantOf: (d) => (typeof d.tenant === 'object' ? d.tenant.slug : d.tenant),
    visibility: () => 'public',
    urlOf: (d) => `/doctors/${d.slug}`,
    project: (d) => ({
      title: d.name,
      sections: [
        { heading: 'Profile',       body: richTextToMarkdown(d.bio) },
        { heading: 'Specialities',  body: (d.specialities ?? []).map((s: any) => s.title).join(', ') },
        { heading: 'Consultation',  body: richTextToMarkdown(d.consultationNotes) },
      ].filter((s) => s.body?.trim()),
    }),
  },

  services: {
    collection: 'services',
    shouldIndex: (d) => d._status === 'published',
    tenantOf: (d) => (typeof d.tenant === 'object' ? d.tenant.slug : d.tenant),
    visibility: (d) => (d.internalOnly ? 'internal' : 'public'),
    urlOf: (d) => `/services/${d.slug}`,
    project: (d) => ({
      title: d.title,
      sections: (d.layout ?? []).map((block: any) => ({
        heading: block.heading ?? block.blockType,
        body: blockToText(block),
      })),
    }),
    dependsOn: [
      {
        collection: 'doctors',
        findAffected: async (payload, changedId) => {
          const res = await payload.find({
            collection: 'services',
            where: { doctors: { contains: changedId } },
            limit: 500,
            depth: 0,
            pagination: false,
          })
          return res.docs.map((d) => String(d.id))
        },
      },
    ],
  },
}

export const isRagSource = (slug: string): boolean => slug in ragSources
