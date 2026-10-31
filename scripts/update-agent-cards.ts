/**
 * Sets the card copy (summary and key points) of the Bot swarm agents, by
 * agent slug, as written in the 24 Oct 2026 brief. Saved as drafts: nothing
 * is published and neither status changes. Each agent is saved on its own,
 * so a value the CMS rejects stops only that agent, and is reported.
 *
 * Safe to re-run: an agent whose draft already holds exactly these values is
 * left alone. Agents it cannot find are reported.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/update-agent-cards.ts [--dry-run] [--remote]
 *
 * Runs only against a database on this machine; add --remote to run it
 * anywhere else, after a backup.
 */
import fs from 'fs'
import { getPayload, ValidationError } from 'payload'

import config from '../src/payload.config'

const say = (s = '') => fs.writeSync(1, s + '\n')
const DRY = process.argv.includes('--dry-run')
const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway, after a backup.')
  process.exit(1)
}
say(`${local ? 'Local' : 'Remote'} database${DRY ? ', dry run: nothing is written' : ''}.`)

type Card = { summary: string; keyPoints: [string, string, string] }

const CARDS: Record<string, Card> = {
  'appointment-assistance': {
    summary: 'Shows open slots on WhatsApp, books the chosen slot in your system and confirms it in the same chat.',
    keyPoints: [
      'Shows only open slots for your locations and doctors',
      'Books the slot in your system and confirms it in chat',
      'Services, doctors and slots set from your dashboard',
    ],
  },
  'payment-services': {
    summary: 'Sends a Razorpay payment link in the WhatsApp chat, replaces expired links and confirms payment in the same chat.',
    keyPoints: [
      'Sends Razorpay payment links in the WhatsApp chat',
      'Replaces expired links and confirms paid ones',
      'Discount rules for new and returning customers',
    ],
  },
  'prescription-understanding': {
    summary: 'Reads each test from a prescription photo on WhatsApp and sends any read under 80 percent confidence to your team.',
    keyPoints: [
      'Reads each test from a prescription photo',
      'Gives every read a confidence score',
      'Reads under 80 percent go to your team to check',
    ],
  },
  'test-matching-and-pricing': {
    summary: 'Matches each test to your billable test list, adds the branch price, and flags unclear matches for your team.',
    keyPoints: [
      'Matches tests to your own billable test list',
      'Adds the current price for the right branch',
      'Flags unclear matches for a person',
    ],
  },
  'student-mark-statement-assessment': {
    summary: "Reads school and diploma transcripts sent on WhatsApp into the student's record in your CRM.",
    keyPoints: [
      'Reads school and diploma transcripts',
      'Saves name, marks and date of birth to your CRM',
      'Follows your order of steps, such as fee first',
    ],
  },
  'identity-and-kyc': {
    summary: 'Asks for ID proofs such as Aadhaar or a photograph on WhatsApp and reads their details into the record.',
    keyPoints: [
      'Asks for the right ID document in the chat',
      'Accepts only the types you allow, such as Aadhaar',
      'Reads the fields into the customer record',
    ],
  },
  'assessment-sampling': {
    summary: 'Picks which recorded calls to check by your rules: daily limit, equal share per person, minimum length, direction.',
    keyPoints: [
      'Daily limits and an equal share per person',
      'Minimum call length, inbound or outbound',
      'Logs which rule held back each call',
    ],
  },
  'call-quality-assessment': {
    summary: 'Transcribes each sampled call, scores it against your sheet, and flags issues for a supervisor to review.',
    keyPoints: [
      'Transcribes and scores calls against your sheet',
      'Marks calls positive, neutral or negative',
      'Sends flagged calls to a supervisor to review',
    ],
  },
  'longitudinal-analysis-and-feedback': {
    summary: "Compares each person's checked calls over four weeks with the group, and writes a weekly progress note.",
    keyPoints: [
      'Compares each person with the group each week',
      'Uses the last four weeks of checked calls',
      'Writes four short notes per person',
    ],
  },
}

const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const

const payload = await getPayload({ config })

const missing: string[] = []
const rejected: string[] = []
const updated: string[] = []
const unchanged: string[] = []

for (const [slug, card] of Object.entries(CARDS)) {
  // The latest version, draft or published, so a pending draft is built on.
  const doc = (
    await payload.find({ ...quiet, collection: 'microApps', where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 0 })
  ).docs[0]
  if (!doc) {
    missing.push(slug)
    continue
  }

  const current = (doc.keyPoints ?? []).map((k) => k.line)
  if (doc.summary === card.summary && JSON.stringify(current) === JSON.stringify(card.keyPoints)) {
    unchanged.push(slug)
    continue
  }
  if (DRY) {
    updated.push(`${slug} (would update)`)
    continue
  }

  try {
    await payload.update({
      ...quiet,
      collection: 'microApps',
      id: doc.id,
      draft: true,
      data: { summary: card.summary, keyPoints: card.keyPoints.map((line) => ({ line })), _status: 'draft' },
    })
    updated.push(`${slug} (status ${doc.status}, saved as a draft)`)
  } catch (err) {
    const fields =
      err instanceof ValidationError
        ? err.data.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
        : err instanceof Error
          ? err.message
          : String(err)
    rejected.push(`${slug}: ${fields}`)
  }
}

say(`${DRY ? 'Dry run, nothing written. ' : ''}${Object.keys(CARDS).length} agents in the brief.`)
say(`\nUpdated (${updated.length}):`)
updated.forEach((s) => say(`  ${s}`))
say(`\nAlready up to date (${unchanged.length}):`)
unchanged.forEach((s) => say(`  ${s}`))
say(`\nNot found (${missing.length}):`)
missing.forEach((s) => say(`  ${s}`))
say(`\nRejected by the CMS (${rejected.length}):`)
rejected.forEach((s) => say(`  ${s}`))
process.exit(rejected.length || missing.length ? 1 : 0)
