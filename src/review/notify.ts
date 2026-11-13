import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { escapeHtml, sendSesEmail } from '@/email/ses'
import { compareWithLivePath } from '@/history/compareLink'
import { checkBenchmark, isLifecycleCollection } from '@/lifecycle/benchmarkGate'
import { getServerSideURL } from '@/utilities/getURL'

type Doc = Record<string, unknown>

const labelOf = (collection: SanitizedCollectionConfig): string => {
  const singular = collection.labels?.singular
  return typeof singular === 'string' ? singular : collection.slug
}

const titleOf = (doc: Doc): string => String(doc.title || doc.name || doc.slug || doc.id)

/** The benchmark gate's verdict on the saved version, in one line. */
const benchmarkLine = async (req: PayloadRequest, slug: string, doc: Doc): Promise<string> => {
  if (!isLifecycleCollection(slug)) return 'Not scored: the benchmark covers industries, topics and micro apps only.'
  try {
    return (await checkBenchmark(req, slug, String(doc.id), doc)).reason
  } catch (err) {
    return `Not scored: the benchmark check failed (${err instanceof Error ? err.message : String(err)}).`
  }
}

/** The email content owners and admins get when an entry is marked Ready for review. */
export const reviewEmail = async ({ req, collection, doc }: { req: PayloadRequest; collection: SanitizedCollectionConfig; doc: Doc }) => {
  const base = (req.payload.config.serverURL || getServerSideURL()).replace(/\/+$/, '')
  const edit = `${base}${req.payload.config.routes.admin}/collections/${collection.slug}/${doc.id}`
  const comparePath = await compareWithLivePath(req, collection.slug, String(doc.id))
  const user = req.user as { name?: string; email?: string } | null
  const by = user ? [user.name, user.email].filter(Boolean).join(', ') : 'Not recorded'
  const rows: [string, string][] = [
    ['Entry', `${titleOf(doc)} (${labelOf(collection)})`],
    ['Marked by', by],
    ['Note', String(doc.reviewNote || '(none)')],
    ['Benchmark', await benchmarkLine(req, collection.slug, doc)],
  ]
  const links: [string, string][] = [
    ['Open in the admin', edit],
    comparePath ? ['Compare with live', `${base}${comparePath}`] : ['Compare with live', 'Not published yet, so there is no live version to compare with.'],
  ]
  const subject = `Ready for review: ${titleOf(doc)} (${labelOf(collection)})`
  const cell = 'padding:4px 14px 4px 0;color:#4A5573;vertical-align:top'
  const html = `
    <p style="font-family:system-ui,sans-serif;font-size:15px">An entry is ready for review in the NeuronCx CMS.</p>
    <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="${cell}">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`).join('')}
      ${links
        .map(([k, v]) => `<tr><td style="${cell}">${k}</td><td style="padding:4px 0">${v.startsWith('http') ? `<a href="${escapeHtml(v)}">${escapeHtml(v)}</a>` : escapeHtml(v)}</td></tr>`)
        .join('')}
    </table>
  `
  const text = [...rows, ...links].map(([k, v]) => `${k}: ${v}`).join('\n')
  return { subject, html, text }
}

/** Content owners and admins, by email. */
const reviewers = async (req: PayloadRequest): Promise<string[]> => {
  const users = await req.payload.find({
    collection: 'users',
    where: { role: { in: ['admin', 'contentOwner'] } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  return [...new Set(users.docs.map((u) => String((u as { email?: string }).email || '')).filter(Boolean))]
}

/** One email per reviewer, so no reviewer sees the others' addresses. */
export const notifyReviewers = async ({ req, collection, doc }: { req: PayloadRequest; collection: SanitizedCollectionConfig; doc: Doc }) => {
  const to = await reviewers(req)
  if (!to.length) {
    req.payload.logger.warn(`Review request for ${collection.slug} ${doc.id} saved, but no email was sent: no reviewers.`)
    return { sent: false as const, reason: 'no recipients' }
  }
  const email = await reviewEmail({ req, collection, doc })
  const results = await Promise.all(to.map((address) => sendSesEmail({ to: [address], ...email })))
  const failed = results.flatMap((r) => (r.sent ? [] : [r.reason]))
  const sent = results.length - failed.length
  if (sent) req.payload.logger.info(`Review request for ${collection.slug} ${doc.id} emailed to ${sent} reviewer(s).`)
  if (failed.length) req.payload.logger.warn(`Review request for ${collection.slug} ${doc.id}: ${failed.length} email(s) not sent: ${[...new Set(failed)].join('; ')}.`)
  return sent ? ({ sent: true } as const) : ({ sent: false, reason: failed[0] } as const)
}
