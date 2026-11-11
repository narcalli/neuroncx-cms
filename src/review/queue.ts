import type { PayloadRequest } from 'payload'

import { compareWithLivePath } from '@/history/compareLink'
import { checkBenchmark, isLifecycleCollection } from '@/lifecycle/benchmarkGate'

import { REVIEW_SLUGS } from './scope'

type Doc = Record<string, unknown> & { id: string }
export type ReviewRow = {
  key: string
  collection: string
  label: string
  title: string
  edit: string
  compare: string | null
  note: string
  by: string
  at: string | null
  benchmark: string
}


const userName = (u: unknown): string => {
  if (!u || typeof u !== 'object') return 'Not recorded'
  const { name, email } = u as { name?: string; email?: string }
  return name || email || 'Not recorded'
}

/** Everything marked Ready for review, oldest request first, read with the viewer's own access. */
export const reviewQueue = async (req: PayloadRequest): Promise<ReviewRow[]> => {
  const rows: ReviewRow[] = []
  for (const slug of REVIEW_SLUGS) {
    const config = req.payload.collections[slug]?.config
    if (!config) continue
    const found = await req.payload.find({
      collection: slug,
      draft: true,
      where: { readyForReview: { equals: true } },
      depth: 1,
      pagination: false,
      overrideAccess: false,
      req,
    })
    const singular = config.labels?.singular
    for (const doc of found.docs as unknown as Doc[]) {
      const benchmark = isLifecycleCollection(slug)
        ? (await checkBenchmark(req, slug, String(doc.id), doc).catch(() => null))?.reason ?? 'Not scored: the benchmark check failed.'
        : 'Not covered by the benchmark.'
      rows.push({
        key: `${slug}:${doc.id}`,
        collection: slug,
        label: typeof singular === 'string' ? singular : slug,
        title: String(doc.title || doc.name || doc.slug || doc.id),
        edit: `${req.payload.config.routes.admin}/collections/${slug}/${doc.id}`,
        compare: await compareWithLivePath(req, slug, String(doc.id)),
        note: String(doc.reviewNote || ''),
        by: userName(doc.reviewRequestedBy),
        at: typeof doc.reviewRequestedAt === 'string' ? doc.reviewRequestedAt : null,
        benchmark,
      })
    }
  }
  return rows.sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
}
