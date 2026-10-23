/**
 * Publishes the bot swarm locally, matching what the live bot-swarm page
 * shows today: the three agent families, the hub, and the nine agents on the
 * page as Live. Qualify, Recover and Status updates stay Planned drafts.
 * No agent gets its own page. Local only; the production copy is promoted
 * from here with scripts/promote-page.mjs.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/publish-bot-swarm-local.ts
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const say = (s = '') => fs.writeSync(1, s + '\n')
if (!/127\.0\.0\.1|localhost/.test(process.env.DATABASE_URL || '')) {
  say('Refusing to run: this database is not on this machine.')
  process.exit(1)
}

/** The agents on the live bot-swarm page's cards, 29 Sep 2026. */
const LIVE = [
  'appointment-assistance',
  'payment-services',
  'prescription-understanding',
  'test-matching-and-pricing',
  'student-mark-statement-assessment',
  'identity-and-kyc',
  'assessment-sampling',
  'call-quality-assessment',
  'longitudinal-analysis-and-feedback',
]
const FAMILIES = ['book-and-get-paid', 'read-and-match-documents', 'check-and-coach-your-team']

const payload = await getPayload({ config })
const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const
let failed = 0

const publish = async (collection: 'lists' | 'microApps' | 'hubs', slug: string, data: Record<string, unknown> = {}) => {
  const doc = (await payload.find({ collection, where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 0, overrideAccess: true })).docs[0] as any
  if (!doc) {
    say(`  ${collection} ${slug}: not found`)
    failed++
    return
  }
  try {
    await payload.update({ ...quiet, collection, id: doc.id, data: { ...data, _status: 'published' } as any })
    say(`  published ${collection} ${slug}${data.status ? ` (${data.status})` : ''}`)
  } catch (err: any) {
    failed++
    const fields = (err?.data?.errors ?? []).map((e: any) => `${e.label || e.path}: ${e.message}`).join('; ')
    say(`  FAILED ${collection} ${slug}: ${fields || err.message}`)
  }
}

say('Families:')
for (const slug of FAMILIES) await publish('lists', slug)
say('Agents:')
for (const slug of LIVE) await publish('microApps', slug, { status: 'live' })
say('Hub:')
await publish('hubs', 'bot-swarm')
say(failed ? `\n${failed} failed.` : '\nAll published.')
process.exit(failed ? 1 : 0)
