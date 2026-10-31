/**
 * Fills the Bot swarm agent drafts from the agent cards on the old bot-swarm
 * page (Pages, slug bot-swarm, saved 29 Sep 2026), which the hub migration
 * could not place. Each card's summary is split by meaning: what the agent
 * does becomes summary, the "no more ..." line becomes result, and "Live
 * at ..." becomes proof. Each of the card's five points goes to the Panel
 * field it describes. Where the step label already says the verb (Checks,
 * Records) the repeated verb is dropped; any other change is noted in EDITS.
 *
 * Only empty fields are filled, so anything already written is kept
 * (Payment services has its copy from the brief and is left alone). Saved as
 * drafts; status is not touched. Every value is checked against its limit
 * and the plain-text rule first, and nothing is written if any fails.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/fill-agents-from-page.ts
 *
 * Local only; refuses any other database.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { plainTextProblem } from '../src/fields/validators/plainText'

const say = (s = '') => fs.writeSync(1, s + '\n')
if (!/127\.0\.0\.1|localhost/.test(process.env.DATABASE_URL || '')) {
  say('Refusing to run: this database is not on this machine.')
  process.exit(1)
}

const LIMITS: Record<string, number> = {
  summary: 140,
  result: 140,
  proof: 140,
  startsWhen: 200,
  hears: 200,
  checks: 300,
  acts: 300,
  handsOver: 240,
  records: 200,
  teamControls: 240,
}

type Fill = Record<string, string> & { passesTo?: never }

/** From the page's agent cards, by agent slug. */
const FILLS: Record<string, Fill> = {
  'appointment-assistance': {
    summary: 'Finds an open slot with the right specialist and books it in your system.',
    result: 'No back and forth to find a time, and no booking outside your rules.',
    proof: 'Live for hospital and Ayurveda care groups.',
    startsWhen: 'A customer taps Book or asks for a slot on WhatsApp.',
    checks: "Your locations, doctors and open slots, so it shows only what's actually available.",
    acts: 'Books the appointment in your system and confirms it in the same chat.',
    records: 'The booking and the full conversation on the customer record.',
    teamControls: 'Your team sets services, doctors and slots from the dashboard, and the chat follows.',
  },
  'prescription-understanding': {
    summary: 'Reads a prescription photo and pulls out each test, so nobody retypes prescriptions.',
    proof: 'Live at a diagnostics chain.',
    startsWhen: 'A prescription photo arrives.',
    checks: "That it's a diagnostics prescription, and politely declines anything else.",
    acts: 'Reads each test using prescription reading AI and scores how sure it is about each one.',
    handsOver: "Flags any read it's less than 80 percent sure of for a person to check.",
    records: 'The results and the image in your own system.',
  },
  'test-matching-and-pricing': {
    summary:
      'Matches each test to your list and looks up its price, so your front desk gets a priced test list from a photo.',
    proof: 'Live at a diagnostics chain.',
    startsWhen: 'Straight after Prescription understanding reads a prescription.',
    checks: "Your own test list, narrowed to the billable tests for that case, so it can't suggest something you don't offer.",
    acts: "Matches each test, looks up its current price for the right branch and adds it to the customer's transaction.",
    handsOver: 'Flags unclear matches for a person.',
    records: 'Matched tests and prices, saved with the document.',
    teamControls: 'Your test list and prices stay in your own system, so a price change needs no change here.',
  },
  'student-mark-statement-assessment': {
    summary: 'Takes transcripts in the chat and reads them into your records.',
    result: "Nobody keys marks into the CRM, and students don't need a portal login.",
    proof: 'Live at a university.',
    startsWhen: 'A student sends a transcript in the chat, or your team asks for one.',
    checks:
      "That it's an accepted type, such as a school transcript or a diploma, and that steps follow your order. For example, the application fee comes before documents.",
    acts: "Reads the name, marks, date of birth and document type into the student's record in your CRM. Can ask for an entrance scorecard to check scholarship eligibility.",
    records: 'The fields and the document on the student record.',
  },
  'identity-and-kyc': {
    summary: 'Takes ID proofs and photos in the chat and reads them into your records.',
    result: 'ID documents arrive in the app people already use and land in the record without retyping.',
    startsWhen: 'A student or customer sends an ID proof or photo in the chat.',
    checks: "That it's an accepted type, such as Aadhaar or a photograph.",
    acts: 'Asks for the right document and confirms when it arrives, then reads the fields and adds them to the record.',
    records: 'The fields and the document on the record.',
  },
  'assessment-sampling': {
    summary: "Picks which calls to check, so every team member gets a fair share and nobody's calls are missed or counted twice.",
    startsWhen: 'A call ends and its recording arrives from your phone system.',
    hears: "The call's details: length, direction and who took it.",
    checks: 'Your rules: a daily limit, an equal share per person, a minimum call length, and inbound or outbound.',
    acts: 'Sends only the calls that pass on for checking.',
    records: 'Which rule held back each of the other calls.',
    teamControls: 'Your team sets the rules and their limits.',
  },
  'call-quality-assessment': {
    summary: 'Turns each call into text and scores it against your sheet.',
    result: 'Every sampled call is scored the same way, without a supervisor listening to each one.',
    startsWhen: 'A call passes sampling.',
    checks: 'The language of the call, and sets junk calls aside.',
    acts: 'Scores each item on your sheet out of 10, as a yes or no, or as "not applicable". Marks the call positive, neutral or negative, and flags issues such as quoting rates on the phone or a customer calling back about an unresolved problem.',
    handsOver: 'Puts flagged calls in the review screen for a supervisor.',
    records: 'Transcripts, scores and flags, saved to your reports.',
    teamControls: 'Your team controls the scoring sheets, weights, flags and the wording of each check.',
  },
  'longitudinal-analysis-and-feedback': {
    summary: 'Shows how each team member is improving, week by week.',
    result: 'Managers see who is improving, who is stuck and where, without building reports by hand.',
    startsWhen: 'Each week, for anyone with at least 10 checked calls that week. If there are fewer, it waits two days and tries again.',
    hears: 'The last four weeks of checked calls, with scores, comments and evidence.',
    checks: 'Each person against the group: overall, by form and by individual item.',
    acts: 'Writes four short notes, and says plainly when a week has too few calls to trust.',
    records: 'Each report, with the date it ran and the weeks it covers.',
  },
}

/** Links the page states outright: "Starts straight after ..." and "when a call passes sampling". */
const PASSES_TO: Record<string, string> = {
  'prescription-understanding': 'test-matching-and-pricing',
  'assessment-sampling': 'call-quality-assessment',
}

/** Wording changed from the page, beyond dropping a repeated verb. */
const EDITS = [
  'Appointment assistance, checks: "and shows only" became "so it shows only".',
  'Test matching and pricing: point 4 split, "Flags unclear matches for a person" to hands over, "saves matched tests and prices with the document" to records.',
  'Student transcript assessment, acts: point 4 (entrance scorecard) joined to point 3.',
  'Identity and KYC, acts: points 2 and 4 joined into one sentence.',
  'Assessment sampling: point 4 split, sending to acts, "records which rule held back the rest" reworded for records.',
  'Call quality assessment: summary split at "so", the second half reworded as result; point 1 split between starts when and checks; points 2 and 3 joined in acts; point 4 split between hands over and records.',
  'Longitudinal analysis and feedback, starts when: "Runs weekly for anyone" became "Each week, for anyone"; checks: "Compares each person with the group" became "Each person against the group".',
]

/* ------------------------------------------------------------------ */

const problems: string[] = []
for (const [slug, fill] of Object.entries(FILLS)) {
  for (const [field, value] of Object.entries(fill)) {
    const max = LIMITS[field]
    if (!max) problems.push(`${slug}.${field}: not a field this script fills`)
    else if (value.length > max) problems.push(`${slug}.${field}: ${value.length} of ${max} characters`)
    const plain = plainTextProblem(value)
    if (plain) problems.push(`${slug}.${field}: ${plain}`)
  }
}
if (problems.length) {
  say('Nothing written. Fix these first:')
  for (const p of problems) say(`  ${p}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const
const latest = async (slug: string) =>
  (await payload.find({ collection: 'microApps', where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 0, overrideAccess: true }))
    .docs[0] as Record<string, any> | undefined

const empty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)

for (const [slug, fill] of Object.entries(FILLS)) {
  const doc = await latest(slug)
  if (!doc) {
    say(`${slug}: not found locally, skipped`)
    continue
  }
  const data: Record<string, unknown> = {}
  const kept: string[] = []
  for (const [field, value] of Object.entries(fill)) {
    if (empty(doc[field])) data[field] = value
    else kept.push(field)
  }
  const next = PASSES_TO[slug]
  if (next && empty(doc.passesTo)) {
    const target = await latest(next)
    if (target) data.passesTo = [target.id]
  }
  if (!Object.keys(data).length) {
    say(`${doc.name}: nothing empty to fill`)
    continue
  }
  await payload.update({ ...quiet, collection: 'microApps', id: doc.id, draft: true, data: { ...data, _status: 'draft' } as any })
  say(
    `${doc.name}: filled ${Object.keys(data).join(', ')}` +
      (kept.length ? `; kept existing ${kept.join(', ')}` : '') +
      ` (status ${doc.status}, draft)`,
  )
}
say('\nWording changed from the page, beyond dropping a repeated verb:')
for (const e of EDITS) say(`  - ${e}`)
process.exit(0)
