/**
 * Rubric v5 for the content lifecycle (11 Nov 2026), drawn from the NeuronCx Content Lifecycle
 * Guideline v1.1 (docs/content-lifecycle-guideline.md): sections 6.4 (the two
 * dimensions), 5.2 (house rules, quoted as written) and 6.3 (severity:
 * blockers only for the cases it lists). No earlier version was published, so
 * this is the first rubric in the CMS: its version there starts at 1.
 *
 * FROZEN for this project. v3 (11 Nov 2026) settled the four ambiguities the
 * second calibration found, and was frozen. v4 changed wording only, and only
 * to move fifteen checks from a person to code (scripts/benchmark/mechanical.ts),
 * which makes scores reproducible: the same content always gets the same
 * result on those checks.
 *
 * What may change a frozen rubric: moving a check from a person to code
 * (v4), or fixing a defect, a check that fires on copy it was never meant to
 * catch (v5). What may not: scores being too low. The rubric is never edited
 * to make a particular entry pass (guideline 6.9).
 *
 * v5 fixed five such defects in v4's new code checks: hr-claims-have-evidence
 * no longer treats a product threshold or setting as a claim (it was a false
 * blocker); en-concrete-example looks for its three elements across one
 * section, not one sentence; ex-sections-stand-alone and ex-kb-answer-complete
 * accept the primary keyword or a catalogue or terms name, as headings do;
 * ex-lists-for-enumerations reads a comma before so, because, which or and
 * then as a clause boundary; ex-faq-answers-stand-alone accepts any repeated
 * word that is not a common word.
 *
 * Scoring rulings (11 Nov 2026), for whoever fills in a worksheet:
 * - An agent group name ("Book and get paid") is a grouping, not a NeuronCx
 *   product name, so it is not listed for ex-product-claims-exist.
 * - The Synonyms field (kbSynonyms) holds names for search, not a second name
 *   for the entry, so it does not fail ex-one-name.
 *
 * Known limits, kept on purpose as the price of deciding in code:
 * - hr-observation-not-criticism has no scope: it fails a listed word in any
 *   sentence, such as "who is stuck" about team members.
 * - Word-list checks match words, not meaning: en-audience-named passes on
 *   "school" in "school and diploma transcripts". Seven checks still need a person:
 * ex-one-name, ex-facts-stated-once, ex-kb-questions-answered,
 * en-task-completes (entries other than agents), hr-no-patient-data, and the
 * names for hr-no-client-names and ex-product-claims-exist.
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
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-rubric-v5.ts [--dry-run]
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
export const RUBRIC_V5: Item[] = [
  // AI extractability (guideline 6.4)
  {
    itemId: 'ex-headings-name-subject',
    dimension: 'extractability',
    criterion: 'Headings phrased as the questions readers ask.',
    passCondition:
      'Every section heading contains the entry name, its primary keyword, or a name from the catalogue or the NeuronCx terms list. None is a bare label (Overview, Introduction, Benefits, Features, How it works, Why us, Details, More), and none pairs the entry name with an admin or tab word (Listing, Card, Panel, Page, Detail, Platform sections, Interim), as in "Higher Education: Listing".',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-sections-stand-alone',
    dimension: 'extractability',
    criterion: 'Each section answers its heading without depending on an earlier section.',
    passCondition:
      'Each section names its subject in its heading or its first sentence (the entry name, its primary keyword, or a name from the catalogue or the NeuronCx terms list), and no section starts with It, This, These, They or That.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-no-outside-references',
    dimension: 'extractability',
    criterion:
      'No "as mentioned above", no orphan pronouns, no context that only exists in the page\'s visual layout.',
    passCondition:
      'The text contains none of: as mentioned, above, below, earlier section, previous section, as shown, on the left, on the right, the icon, the green, the highlighted. No sentence tells the reader to select, click, tap, pick, hover, scroll or watch something on the page, and no sentence starts with It, This, They or These.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-terms-defined',
    dimension: 'extractability',
    criterion: 'Canonical NCX terminology, used consistently, defined on first use.',
    passCondition:
      'The first sentence that uses each term on the NeuronCx terms list in Content standards says what it is: it reads "<term> is", "<term> are" or "<term> means", or the explanation follows the term straight away in brackets or after a comma, as in "cart, a course choice saved on the record".',
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
      'Counting each comma and each and, or and then as a join: no sentence has three or more joins, and no sentence of more than 25 words has two. A comma before so, because, which or and then ends a clause and is not a join, and and then counts once. Card fields (tagline, summary, key points) are exempt.',
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
      'No FAQ question contains the word it or this. Each answer starts with Yes, No or a number, or its first sentence repeats a word from its question other than a common word (question words, pronouns, articles, prepositions and verbs such as is, can, do or happen). Not applicable when the entry has no FAQs.',
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
      'Answer (kbAnswer) is filled, and its first sentence contains the entry name, its primary keyword, or a name from the catalogue or the NeuronCx terms list, and a word or phrase from the audience list in Content standards.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'ex-kb-facts-checkable',
    dimension: 'extractability',
    criterion: 'Facts stated once, in the place that owns them. (Knowledge base facts)',
    passCondition:
      'Facts (kbFacts) has at least three rows, each a single sentence of 160 characters or fewer that does not start with It, This, They, These or That.',
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
      'The entry contains at least one word or phrase from the audience list in Content standards: the people who use NeuronCx (front desk, supervisor) or their business type (diagnostic chain, college), not their customers.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-hero-says-what',
    dimension: 'engagement',
    criterion: 'Scannable in under a minute: headings, short paragraphs, no walls. (The hero)',
    passCondition:
      `The hero heading contains the entry name or its primary keyword, and the hero subheading contains a word or phrase from the audience list in Content standards. ${NO_OWN_PAGE}`,
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-task-completes',
    dimension: 'engagement',
    criterion: 'The task completes on the page, with no undocumented step.',
    passCondition:
      'Every step of each process the entry describes names who or what does it (the agent, the customer, the team), either in the sentence or through the step label it sits under: a row reading "Acts: Books the appointment" passes. The process ends with its result stated (for an agent, Result is filled), and no step says set up, configure or integrate without saying how or linking to where.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'en-concrete-example',
    dimension: 'engagement',
    criterion: 'Examples are concrete and NCX-specific, not generic.',
    passCondition:
      'At least one section (a heading and its text) contains a word from the channel list in Content standards, a digit or words in quotation marks, and the entry name or a name from the catalogue: the example as a whole, not one sentence, holds all three.',
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
    passCondition:
      'Summary is filled, 140 characters or fewer, does not repeat the entry name, and does not start with It, This, They, These or That.',
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
      'HIPAA does not appear, and every sentence that mentions data protection, personal data, a privacy policy or data residency names the DPDP Act.',
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
      'None of these appears anywhere, in any form: outdated, broken, fail, struggle, chaos, nightmare, stuck, still using, old-fashioned.',
    severityIfFailed: 'warning',
  },
  {
    itemId: 'hr-claims-have-evidence',
    dimension: 'houseRules',
    criterion: 'Claims carry evidence. A number without a source does not ship.',
    passCondition:
      'Every percentage or multiple (a number followed by %, per cent, percent, x or times) presented as a result or a market fact names its source in the same sentence (according to, source, survey, study or report), or the entry links to a published customer entry. A figure is a result or market fact when its sentence says fewer, faster, reduced, cut, saved, increased, improved, rose, grew or boosted (in any form), or reads "<figure> of <something>", as in "40% of bookings". A figure that describes how the product behaves, a threshold or a setting such as "under 80 percent confidence", needs no source. Plain counts, limits and times are exempt. A figure marked pending counts as unsourced wherever it shows.',
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

// Only when run directly: scripts/benchmark.ts imports RUBRIC_V5.
if (process.argv[1]?.endsWith('seed-rubric-v5.ts')) {
  const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
  if (!local && !process.argv.includes('--remote')) {
    say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
    process.exit(1)
  }
  const blockers = RUBRIC_V5.filter((i) => i.severityIfFailed === 'blocker').length
  say(`${RUBRIC_V5.length} items, ${blockers} blockers${DRY ? '. Dry run: nothing is written' : ''}.`)
  for (const i of RUBRIC_V5) say(`  ${i.itemId} (${i.dimension}, ${i.severityIfFailed})`)
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
      items: RUBRIC_V5.map((i) => ({ ...i, appliesTo: [...LIFECYCLE_SLUGS] })),
      _status: 'draft',
    },
  })
  say(`Created "${NAME}" as a draft (${rubric.id}). Publish it from the admin once it is calibrated.`)
  process.exit(0)
}
