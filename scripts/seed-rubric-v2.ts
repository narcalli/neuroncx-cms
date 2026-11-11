/**
 * Rubric v2 for the content lifecycle (11 Nov 2026): v1 after one calibration
 * on the ten published entries, drawn from the NeuronCx Content Lifecycle
 * Guideline v1.1 (docs/content-lifecycle-guideline.md): sections 6.4 (the two
 * dimensions), 5.2 (house rules, quoted as written) and 6.3 (severity:
 * blockers only for the cases it lists). v1 was never published, so this is
 * the first rubric in the CMS: its version there starts at 1.
 *
 * Creates the rubric as a draft, so nobody is scored against it until it is
 * published from the admin. Publishing it as Active retires whichever rubric
 * is Active then.
 *
 * Two blockers that guideline 6.3 reserves have no check here: a screenshot
 * that no longer matches the product, and a broken core task flow. Neither can
 * be judged from these three collections' text (they describe processes rather
 * than walk a reader through the product, and nothing records when an image
 * was taken). That stops holding when pages, posts and the user portal come
 * into scope: both checks are needed then.
 *
 * Not applicable is decided per document, not per content type: an SEO check
 * on an entry with no page of its own is not applicable to that entry.
 *
 * Checks are scored on the text as NCX receives it (scripts/calibrate-rubric.ts
 * shows it, title line included), plus the fields it leaves out where a check
 * names them (card, hero, images, SEO). Lists the checks name (third parties,
 * NeuronCx terms) are kept in Content standards.
 *
 * Item IDs are permanent once published: a removed ID can never come back.
 * IDs starting ex-kb- are about the Knowledge base tab only, so they can be
 * switched off for content that never syncs to NCX.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-rubric-v2.ts [--dry-run]
 *
 * --dry-run lists the items and writes nothing. Refuses to run if a rubric
 * with this name already exists. Runs only against a database on this
 * machine; add --remote to run it anywhere else.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { LIFECYCLE_SLUGS } from '../src/lifecycle/scope'
import type { Rubric } from '../src/payload-types'

type Item = Omit<NonNullable<Rubric['items']>[number], 'id' | 'appliesTo'>

const NAME = 'NeuronCx content rubric'

const NO_OWN_PAGE = 'Not applicable when the entry has no page of its own.'

// Every item applies to all three collections in scope for now. Items about
// the Knowledge base tab are the ones to narrow first (IDs ex-kb-).
export const RUBRIC_V2: Item[] = [
  // AI extractability (guideline 6.4)
  {
    itemId: 'ex-headings-name-subject',
    dimension: 'extractability',
    criterion: 'Headings phrased as the questions readers ask.',
    passCondition:
      'Every section heading names the subject of its section in words a reader would search for (the task, problem or feature by name), and none is a bare label: Overview, Introduction, Benefits, Features, How it works, Why us, Details, More.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-sections-stand-alone',
    dimension: 'extractability',
    criterion: 'Each section answers its heading without depending on an earlier section.',
    passCondition:
      'In the text as NCX receives it, each section names its subject (the entry, task or feature by name) in its heading or first sentence, and no section opens with it, this, these, they or that.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-no-outside-references',
    dimension: 'extractability',
    criterion:
      'No "as mentioned above", no orphan pronouns, no context that only exists in the page\'s visual layout.',
    passCondition:
      'The text contains none of: as mentioned, above, below, earlier section, previous section, as shown, on the left, on the right, the icon, the green, the highlighted. No sentence tells the reader to select, click, tap, pick, hover, scroll or watch something on the page, and no sentence opens with It, This, They or These without naming what it means in that sentence.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-terms-defined',
    dimension: 'extractability',
    criterion: 'Canonical NCX terminology, used consistently, defined on first use.',
    passCondition:
      'The first use of each term on the NeuronCx terms list in Content standards is in a sentence that says what it is.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-one-name',
    dimension: 'extractability',
    criterion: 'Canonical NCX terminology, used consistently, defined on first use. (The entry\'s own name)',
    passCondition:
      'The entry is called by one name throughout: no second name for the same thing (for example admission CRM and education CRM for one product).',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-lists-for-enumerations',
    dimension: 'extractability',
    criterion: 'Lists and tables for enumerable facts rather than prose.',
    passCondition:
      'No sentence lists four or more parallel items separated by commas, and no sentence of more than 25 words lists three. Card fields (tagline, summary, key points) are exempt.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-image-meaning-in-text',
    dimension: 'extractability',
    criterion: 'Alt text and captions carry the meaning of every image.',
    passCondition:
      'Every image on the entry has alt text that is not empty, not a file name and not just image, screenshot, photo, banner or hero. Not applicable when the entry has no images.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-facts-stated-once',
    dimension: 'extractability',
    criterion: 'Facts stated once, in the place that owns them.',
    passCondition:
      'No sentence of eight or more words appears twice on the entry, and no fact (a number, a time, a limit, a channel) is given two different values in two places.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-faq-answers-stand-alone',
    dimension: 'extractability',
    criterion: 'Each section answers its heading without depending on an earlier section (FAQ answers).',
    passCondition:
      "Every FAQ question names its subject instead of using it or this, and every answer's first sentence answers it (yes, no, a number or the fact asked for). A bare yes or no passes when the next sentence names the subject. Not applicable when the entry has no FAQs.",
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-product-claims-exist',
    dimension: 'extractability',
    criterion: 'No factually wrong product claim (guideline 6.3).',
    passCondition:
      'Every NeuronCx product, agent or integration the entry names by a proper name is a published record in features, microApps, integrations or crmFeatures, or on the NeuronCx terms list in Content standards. Claims about what a product can do are left to the module owner\'s sign-off (guideline 6.8).',
    severityIfFailed: 'blocker',
  },
  {
    itemId: 'ex-kb-answer-complete',
    dimension: 'extractability',
    criterion: 'Can a retrieval system answer a question correctly using this page alone? (Knowledge base answer)',
    passCondition:
      'Answer (kbAnswer) is filled, and its first sentence names the entry and says what it does and for whom, so it answers "What is <name>?" with nothing else read.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-kb-facts-checkable',
    dimension: 'extractability',
    criterion: 'Facts stated once, in the place that owns them. (Knowledge base facts)',
    passCondition:
      'Facts (kbFacts) has at least three rows, each one sentence making one claim, with the entry or a noun as its subject, never a pronoun.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-kb-questions-answered',
    dimension: 'extractability',
    criterion: 'Headings phrased as the questions readers ask. (Knowledge base questions)',
    passCondition:
      'Questions (kbQuestions) has at least three rows ending in a question mark, and each is answered by a sentence somewhere on the entry (answer, facts, FAQs or sections).',
    severityIfFailed: 'warning',
  },

  // Human engagement (guideline 6.4)
  {
    itemId: 'en-short-paragraphs',
    dimension: 'engagement',
    criterion: 'Scannable in under a minute: headings, short paragraphs, no walls.',
    passCondition: 'No paragraph is over 60 words, and no run of more than 150 words goes without a heading.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-sentence-length',
    dimension: 'engagement',
    criterion: 'Reading level matches the named audience.',
    passCondition: 'No sentence is over 35 words, and the average sentence is 22 words or fewer.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-audience-named',
    dimension: 'engagement',
    criterion: 'Can the named reader finish what they came to do?',
    passCondition:
      'The entry names the NeuronCx user it is for at least once, as a role (front desk, admissions counsellor, supervisor) or their business type (diagnostic chain, college), not only their customer or student.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-hero-says-what',
    dimension: 'engagement',
    criterion: 'Scannable in under a minute: headings, short paragraphs, no walls. (The hero)',
    passCondition: `The hero heading names the entry or the outcome it gives, and the hero subheading names the reader or their business. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-task-completes',
    dimension: 'engagement',
    criterion: 'The task completes on the page, with no undocumented step.',
    passCondition:
      'Every step of each process the entry describes is a full sentence that names who or what does it (the agent, the customer, the team), the process ends with its result stated (for an agent, Result is filled), and no step says set up, configure or integrate without saying how or linking to where.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-concrete-example',
    dimension: 'engagement',
    criterion: 'Examples are concrete and NCX-specific, not generic.',
    passCondition:
      'At least one passage describes a specific situation that names all three of: who (a role or person), the channel, and a time, number or item, together with an NCX agent, channel or feature by name.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-next-action',
    dimension: 'engagement',
    criterion: 'The next action is obvious.',
    passCondition: `The page has a button or link whose label starts with a verb (Book, See, Talk, Try, Get) and points to a page or contact route, set on the entry or by the page defaults it follows. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-card-summary',
    dimension: 'engagement',
    criterion: 'Scannable in under a minute: headings, short paragraphs, no walls. (The card)',
    passCondition: 'Summary is filled, says what the entry is or does, and does not repeat the entry name.',
    severityIfFailed: 'warning',
  },

  // House rules (guideline 5.2, quoted as written; patient data from 6.3)
  {
    itemId: 'hr-no-em-dashes',
    dimension: 'houseRules',
    criterion: 'No em dashes anywhere. Use a hyphen, a comma, or restructure the sentence.',
    passCondition: 'No em dash character appears in the text, the card, the SEO fields or the knowledge base fields.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'hr-no-filler',
    dimension: 'houseRules',
    criterion:
      'No machine-sounding filler. Avoid "leverage", "seamless", "robust", "unlock", "revolutionise", "in today\'s fast-paced world", "it\'s not just X, it\'s Y".',
    passCondition:
      "None of these appear in any form (seamlessly, unlocks, revolutionize): leverage, seamless, robust, unlock, revolutionise, in today's fast-paced world, not just ... it's.",
    severityIfFailed: 'warning',
  },
  {
    itemId: 'hr-no-client-names',
    dimension: 'houseRules',
    criterion:
      'No client names in published content unless written permission exists. Describe the category instead, for example "a 14-centre diagnostic chain".',
    passCondition:
      'Every organisation the entry names is NeuronCx, a customer published in customers (which is where permission is recorded), a record in integrations, or on the third-party list in Content standards (such as ad platforms and exam boards). Any other organisation named is a blocker.',
    severityIfFailed: 'blocker',
  },
  {
    itemId: 'hr-no-patient-data',
    dimension: 'houseRules',
    criterion: 'No patient data exposed (guideline 6.3).',
    passCondition:
      'No real person is named together with a health detail, and no phone number, email address or patient or record number appears, unless it is written as a placeholder (for example 98XXXXXX10).',
    severityIfFailed: 'blocker',
  },
  {
    itemId: 'hr-dpdp-not-hipaa',
    dimension: 'houseRules',
    criterion: 'DPDP Act is the compliance frame for India, not HIPAA.',
    passCondition:
      'HIPAA does not appear, and any statement about data protection or compliance in India names the DPDP Act.',
    severityIfFailed: 'blocker',
  },
  {
    itemId: 'hr-cloud-telephony',
    dimension: 'houseRules',
    criterion: '"Cloud telephony", not "agentic telephony".',
    passCondition: 'The phrase agentic telephony does not appear.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'hr-observation-not-criticism',
    dimension: 'houseRules',
    criterion: 'Observation, not criticism, when describing how the market operates today.',
    passCondition:
      'No sentence about how businesses work today uses: outdated, broken, fail, struggle, chaos, nightmare, stuck, still using, old-fashioned.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'hr-claims-have-evidence',
    dimension: 'houseRules',
    criterion: 'Claims carry evidence. A number without a source does not ship.',
    passCondition:
      'Every number given as a result or a market fact (a percentage, multiple, count or time saved) names its source in the same sentence or links to a published proof or customer entry. A figure marked pending counts as unsourced wherever it shows. Product facts (limits, counts of integrations) are exempt.',
    severityIfFailed: 'blocker',
  },

  // Discoverability: SEO and links (guideline 7)
  {
    itemId: 'seo-meta-title',
    dimension: 'discoverability',
    criterion: 'The page has its own search title.',
    passCondition: `SEO title is filled, 60 characters or fewer, and contains the primary keyword (or the entry name when no keyword is set). ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'seo-meta-description',
    dimension: 'discoverability',
    criterion: 'The page has its own search description.',
    passCondition: `SEO description is filled, 70 to 155 characters, and contains the entry name or its primary keyword. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'seo-share-image',
    dimension: 'discoverability',
    criterion: 'The page has a share image.',
    passCondition: `SEO image is set. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'seo-keyword-in-heading',
    dimension: 'discoverability',
    criterion: 'The page is found for the phrase it is written for.',
    passCondition: `Primary keyword is filled and appears in the hero heading or the SEO title. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'seo-internal-links',
    dimension: 'discoverability',
    criterion: 'Add the internal links in both directions (guideline 7).',
    passCondition: `The entry's own fields link to at least one other published entry or page in the CMS, through a link, a button or a related-entries field; the site header and footer do not count. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
]

const say = (s = '') => fs.writeSync(1, s + '\n')
const DRY = process.argv.includes('--dry-run')

// Only when run directly: the calibration script imports RUBRIC_V2.
if (process.argv[1]?.endsWith('seed-rubric-v2.ts')) {
  const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
  if (!local && !process.argv.includes('--remote')) {
    say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
    process.exit(1)
  }
  const blockers = RUBRIC_V2.filter((i) => i.severityIfFailed === 'blocker').length
  say(`${RUBRIC_V2.length} items, ${blockers} blockers${DRY ? '. Dry run: nothing is written' : ''}.`)
  for (const i of RUBRIC_V2) say(`  ${i.itemId} (${i.dimension}, ${i.severityIfFailed})`)
  if (DRY) process.exit(0)

  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'rubrics', where: { name: { equals: NAME } }, limit: 1, draft: true })
  if (existing.docs.length) {
    say(`Refusing to run: a rubric called "${NAME}" already exists.`)
    process.exit(1)
  }
  const rubric = await payload.create({
    collection: 'rubrics',
    draft: true,
    data: {
      name: NAME,
      status: 'active',
      items: RUBRIC_V2.map((i) => ({ ...i, appliesTo: [...LIFECYCLE_SLUGS] })),
      _status: 'draft',
    },
  })
  say(`Created "${NAME}" as a draft (${rubric.id}). Publish it from the admin once it is calibrated.`)
  process.exit(0)
}
