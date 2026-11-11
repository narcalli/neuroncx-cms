/**
 * The checks code can decide on its own (scripts/benchmark.ts), as rubric v3
 * words them. Each returns a verdict, or hands the check to the judge
 * (scripts/benchmark/judge.ts) with what code already found. Deterministic:
 * the same entry always gets the same answer.
 */
import { asDoc, rows, sectionsOf, sentencesOf, str, textOf, words, type Entry, type Refs } from './entry'

export type Verdict = 'pass' | 'fail' | 'na'
export type Decision = { verdict: Verdict; note: string } | { judge: true; hint?: string }

const decided = (verdict: Verdict, note = ''): Decision => ({ verdict, note })
const judge = (hint?: string): Decision => ({ judge: true, hint })
const NO_OWN_PAGE = decided('na', 'No page of its own.')

const lower = (s: string) => s.toLowerCase()
const has = (text: string, phrase: string) => lower(text).includes(lower(phrase))
const wordMatch = (text: string, term: string) =>
  new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(text)

const BARE_LABELS = ['overview', 'introduction', 'benefits', 'features', 'how it works', 'why us', 'details', 'more']
const ADMIN_WORDS = ['listing', 'card', 'panel', 'page', 'detail', 'platform sections', 'interim']
const OUTSIDE = /\b(as mentioned|above|below|earlier section|previous section|as shown|on the left|on the right|the icon|the green|the highlighted)\b/i
const UI_INSTRUCTION = /(^|[.!?]\s+)(select|click|tap|pick|hover|scroll|watch)\b/im
const PRONOUN_OPENER = /(^|[.!?]\s+)(it|this|they|these)\b/im
const FILLER = /\b(leverag\w*|seamless\w*|robust\w*|unlock\w*|revolutioni[sz]\w*|in today's fast-paced world|not just\b[^.]*\bit's\b)/i
const CRITICISM = /\b(outdated|broken|fail\w*|struggl\w*|chaos\w*|nightmare|stuck|still using|old-fashioned)\b/i
const COMPLIANCE = /\b(data protection|privacy|personal data|compliance|compliant|consent|DPDP|GDPR)\b/i
const CONTACT_DATA = /(\b[6-9]\d{9}\b|\+91[\s-]?\d{5}[\s-]?\d{5}|[\w.+-]+@[\w-]+\.[\w.]+|\b(UHID|MRN)\s*[:#]?\s*\d+)/i
const VERB_LABEL = /^(book|see|talk|try|get|start|request|contact|explore|watch|download|ask|schedule|learn|read|join|call)\b/i

const ctaLabel = (doc: Record<string, unknown>, field: string) => str(asDoc(doc[field])?.label).trim()

export const decide = (itemId: string, e: Entry, refs: Refs): Decision => {
  const d = e.doc
  const text = textOf(e)
  const sentences = sentencesOf(text)
  const meta = asDoc(d.meta) ?? {}
  const keyword = str(meta.primaryKeyword).trim()
  const faqs = rows(d.faqs)

  switch (itemId) {
    case 'ex-headings-name-subject': {
      const headings = sectionsOf(e).map((s) => s.heading.trim())
      const bare = headings.find((h) => BARE_LABELS.includes(lower(h)))
      if (bare) return decided('fail', `"${bare}" is a bare label.`)
      const paired = headings.find((h) => {
        const rest = lower(h).startsWith(`${lower(e.name)}:`) ? lower(h).slice(e.name.length + 1).trim() : ''
        return (rest && ADMIN_WORDS.some((w) => rest.startsWith(w))) || /\(interim\)/i.test(h)
      })
      if (paired) return decided('fail', `"${paired}" pairs the entry name with an admin word.`)
      return judge()
    }
    case 'ex-no-outside-references': {
      const phrase = text.match(OUTSIDE)
      if (phrase) return decided('fail', `Says "${phrase[0]}".`)
      const ui = text.match(UI_INSTRUCTION)
      if (ui) return decided('fail', `Tells the reader to "${ui[2]}" something on the page.`)
      return PRONOUN_OPENER.test(text) ? judge('Some sentences open with It, This, They or These.') : decided('pass')
    }
    case 'ex-terms-defined': {
      const used = refs.terms.filter((t) => wordMatch(text, t))
      return used.length ? judge(`Terms on the list used here: ${used.join(', ')}.`) : decided('pass', 'No term on the list is used.')
    }
    case 'ex-image-meaning-in-text': {
      if (!e.images.length) return decided('na', 'No images.')
      const bad = e.images.find(
        (i) => !i.alt.trim() || /\.(png|jpe?g|gif|svg|webp)$/i.test(i.alt.trim()) || /^(image|screenshot|photo|banner|hero)$/i.test(i.alt.trim()),
      )
      return bad ? decided('fail', `${bad.at} has no meaningful alt text.`) : decided('pass')
    }
    case 'ex-facts-stated-once': {
      const long = sentences.filter((s) => words(s) >= 8).map((s) => lower(s))
      const twice = long.find((s, i) => long.indexOf(s) !== i)
      return twice ? decided('fail', `Appears twice: "${twice.slice(0, 80)}".`) : judge('No sentence of eight or more words repeats; check for one fact given two values.')
    }
    case 'ex-faq-answers-stand-alone':
      return faqs.length ? judge() : decided('na', 'No FAQs.')
    case 'ex-kb-answer-complete':
      return str(d.kbAnswer).trim() ? judge() : decided('fail', 'Answer is empty.')
    case 'ex-kb-facts-checkable': {
      const n = rows(d.kbFacts).length
      return n < 3 ? decided('fail', `${n} facts, fewer than three.`) : judge()
    }
    case 'ex-kb-questions-answered': {
      const qs = rows(d.kbQuestions).map((r) => str(r.question).trim())
      if (qs.length < 3) return decided('fail', `${qs.length} questions, fewer than three.`)
      const open = qs.find((q) => !q.endsWith('?'))
      return open ? decided('fail', `"${open}" does not end in a question mark.`) : judge()
    }
    case 'en-short-paragraphs': {
      const long = text.split(/\n+/).find((p) => words(p) > 60)
      if (long) return decided('fail', `A paragraph of ${words(long)} words.`)
      const wall = sectionsOf(e).find((s) => words(s.body) > 150)
      return wall ? decided('fail', `"${wall.heading}" runs ${words(wall.body)} words under one heading.`) : decided('pass')
    }
    case 'en-sentence-length': {
      const longest = sentences.reduce((a, b) => (words(b) > words(a) ? b : a), '')
      const avg = sentences.length ? sentences.reduce((n, s) => n + words(s), 0) / sentences.length : 0
      if (words(longest) > 35) return decided('fail', `A sentence of ${words(longest)} words.`)
      if (avg > 22) return decided('fail', `Average sentence ${avg.toFixed(1)} words.`)
      return decided('pass')
    }
    case 'en-hero-says-what':
      return e.ownPage ? judge() : NO_OWN_PAGE
    case 'en-next-action': {
      if (!e.ownPage) return NO_OWN_PAGE
      const labels = [ctaLabel(d, 'cta'), ctaLabel(d, 'heroSecondaryCta')].filter(Boolean)
      if (labels.some((l) => VERB_LABEL.test(l))) return decided('pass')
      if (d.usePageDefaults !== false) return decided('pass', 'Follows the page defaults, which carry the buttons.')
      return decided('fail', labels.length ? `No button label starts with a verb: ${labels.join(', ')}.` : 'No button on the entry, and it does not follow the page defaults.')
    }
    case 'en-task-completes':
      if (e.collection === 'microApps') {
        return str(d.result).trim() ? decided('pass', 'Panel steps under their labels, with a Result.') : decided('fail', 'Result is empty.')
      }
      return judge()
    case 'en-card-summary': {
      const summary = str(d.summary).trim()
      if (!summary) return decided('fail', 'Summary is empty.')
      if (has(summary, e.name)) return decided('fail', 'Summary repeats the entry name.')
      return judge()
    }
    case 'hr-no-em-dashes':
      return e.raw.includes('—') ? decided('fail', 'An em dash appears.') : decided('pass')
    case 'hr-no-filler': {
      const hit = e.raw.match(FILLER)
      return hit ? decided('fail', `Uses "${hit[0]}".`) : decided('pass')
    }
    case 'hr-cloud-telephony':
      return /agentic telephony/i.test(e.raw) ? decided('fail', 'Says agentic telephony.') : decided('pass')
    case 'hr-observation-not-criticism': {
      const hit = text.match(CRITICISM)
      return hit ? judge(`Uses "${hit[0]}": decide whether that sentence is about how businesses work today.`) : decided('pass')
    }
    case 'hr-dpdp-not-hipaa':
      if (/\bHIPAA\b/.test(e.raw)) return decided('fail', 'Mentions HIPAA.')
      return COMPLIANCE.test(text) ? judge('Mentions data protection or compliance.') : decided('pass', 'No compliance statement.')
    case 'hr-no-patient-data': {
      const hit = e.raw.match(CONTACT_DATA)
      return hit ? decided('fail', `Contains "${hit[0]}".`) : judge()
    }
    case 'hr-claims-have-evidence':
      return /\d/.test(text) ? judge() : decided('pass', 'No numbers.')
    case 'seo-meta-title': {
      if (!e.ownPage) return NO_OWN_PAGE
      const title = str(meta.title).trim()
      if (!title) return decided('fail', 'SEO title is empty.')
      if (title.length > 60) return decided('fail', `SEO title is ${title.length} characters.`)
      return has(title, keyword || e.name) ? decided('pass') : decided('fail', `SEO title does not contain "${keyword || e.name}".`)
    }
    case 'seo-meta-description': {
      if (!e.ownPage) return NO_OWN_PAGE
      const desc = str(meta.description).trim()
      if (desc.length < 70 || desc.length > 155) return decided('fail', `SEO description is ${desc.length} characters.`)
      return has(desc, e.name) || (keyword && has(desc, keyword)) ? decided('pass') : decided('fail', 'SEO description has neither the name nor the keyword.')
    }
    case 'seo-share-image':
      if (!e.ownPage) return NO_OWN_PAGE
      return meta.image ? decided('pass') : decided('fail', 'No SEO image.')
    case 'seo-keyword-in-heading': {
      if (!e.ownPage) return NO_OWN_PAGE
      if (!keyword) return decided('fail', 'No primary keyword.')
      return has(str(d.heroHeading), keyword) || has(str(meta.title), keyword) ? decided('pass') : decided('fail', `"${keyword}" is in neither the hero heading nor the SEO title.`)
    }
    case 'seo-internal-links':
      if (!e.ownPage) return NO_OWN_PAGE
      return e.links.length ? decided('pass') : decided('fail', 'The entry links to no other entry or page.')
    default:
      return judge()
  }
}

/** hr-no-client-names, from the organisations the judge found: allowed only if listed. */
export const decideOrganisations = (names: string[], e: Entry, refs: Refs): { verdict: Verdict; note: string } => {
  const allowed = ['NeuronCx', 'NeuronCX', 'NCX', ...refs.customers, ...refs.integrations, ...refs.thirdParties].map(lower)
  const unknown = names.filter((n) => !allowed.includes(lower(n.trim())))
  return unknown.length ? { verdict: 'fail', note: `Names organisations not on any list: ${unknown.join(', ')}.` } : { verdict: 'pass', note: '' }
}

/** ex-product-claims-exist, from the NeuronCx names the judge found: each must exist. */
export const decideProductNames = (names: string[], e: Entry, refs: Refs): { verdict: Verdict; note: string } => {
  const known = [e.name, ...refs.catalogue, ...refs.terms].map(lower)
  const unknown = names.filter((n) => {
    const name = lower(n.trim())
    return !known.some((k) => k === name || (name.length >= 4 && (k.includes(name) || name.includes(k))))
  })
  return unknown.length ? { verdict: 'fail', note: `Names NeuronCx products that are not published records or terms: ${unknown.join(', ')}.` } : { verdict: 'pass', note: '' }
}
