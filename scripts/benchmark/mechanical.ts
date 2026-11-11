/**
 * The checks code decides on its own (scripts/benchmark.ts), as rubric v5
 * words them. Each returns a verdict, or hands the check to a person on the
 * worksheet (scripts/benchmark/worksheet.ts) with what code already found.
 * Deterministic: the same entry always gets the same answer. Seven checks
 * stay with a person; everything else is decided here.
 */
import { asDoc, rows, sectionsOf, sentencesOf, str, textOf, words, type Entry, type Refs, type Section } from './entry'

export type Verdict = 'pass' | 'fail' | 'na'
export type Decision = { verdict: Verdict; note: string } | { judge: true; hint?: string }

const decided = (verdict: Verdict, note = ''): Decision => ({ verdict, note })
const judge = (hint?: string): Decision => ({ judge: true, hint })
const NO_OWN_PAGE = decided('na', 'No page of its own.')

const lower = (s: string) => s.toLowerCase()
const has = (text: string, phrase: string) => Boolean(phrase) && lower(text).includes(lower(phrase))
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordMatch = (text: string, term: string) => new RegExp(`(^|[^\\p{L}])${escape(term)}([^\\p{L}]|$)`, 'iu').test(text)
// A word from a Content standards list, singular or plural ("manager", "Managers").
const listMatch = (text: string, term: string) => new RegExp(`(^|[^\p{L}])${escape(term)}(s|es)?([^\p{L}]|$)`, 'iu').test(text)
const anyOf = (text: string, list: string[]) => list.find((w) => listMatch(text, w))
const firstSentence = (text: string) => sentencesOf(text)[0] ?? ''
const quoteShort = (s: string) => `"${s.length > 90 ? `${s.slice(0, 90)}...` : s}"`

const BARE_LABELS = ['overview', 'introduction', 'benefits', 'features', 'how it works', 'why us', 'details', 'more']
const ADMIN_WORDS = ['listing', 'card', 'panel', 'page', 'detail', 'platform sections', 'interim']
const OUTSIDE = /\b(as mentioned|above|below|earlier section|previous section|as shown|on the left|on the right|the icon|the green|the highlighted)\b/i
const UI_INSTRUCTION = /^(select|click|tap|pick|hover|scroll|watch)\b/i
const PRONOUN_START = /^(it|this|they|these)\b/i
const PRONOUN_START_WITH_THAT = /^(it|this|they|these|that)\b/i
const FILLER = /\b(leverag\w*|seamless\w*|robust\w*|unlock\w*|revolutioni[sz]\w*|in today's fast-paced world|not just\b[^.]*\bit's\b)/i
const CRITICISM = /\b(outdated|broken|fail\w*|struggl\w*|chaos\w*|nightmare|stuck|still using|old-fashioned)\b/i
const DATA_PROTECTION = /\b(data protection|personal data|privacy policy|data residency)\b/i
const CONTACT_DATA = /(\b[6-9]\d{9}\b|\+91[\s-]?\d{5}[\s-]?\d{5}|[\w.+-]+@[\w-]+\.[\w.]+|\b(UHID|MRN)\s*[:#]?\s*\d+)/i
const VERB_LABEL = /^(book|see|talk|try|get|start|request|contact|explore|watch|download|ask|schedule|learn|read|join|call)\b/i
const FIGURE = /\b\d+(\.\d+)?\s*(%|per ?cent\b|x\b|times\b)/i
const SOURCE = /\b(according to|source|survey|study|report)\b/i
// A figure presented as a result or a market fact, not as how the product behaves.
const RESULT_WORDS = /\b(fewer|faster|reduc\w*|cut|cuts|sav(e|es|ed|ing)|increas\w*|improv\w*|rose|rise|rises|grew|grow\w*|boost\w*)\b/i
const FIGURE_OF = /\b\d+(\.\d+)?\s*(%|per ?cent|x|times)\s+of\s+\w/i
// Commas that end a clause, and so do not separate list items.
const CLAUSE_COMMA = /,(?=\s+(so|because|which|and then)\b)/gi
// Words a FAQ answer may repeat without that showing it answers the question.
const COMMON = new Set(['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been', 'am', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'shall', 'may', 'might', 'must', 'has', 'have', 'had', 'get', 'gets', 'happen', 'happens', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'about', 'into', 'and', 'or', 'if', 'than', 'then', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'we', 'you', 'they', 'he', 'she', 'our', 'your', 'their', 'my', 'me', 'us', 'them', 'not', 'no', 'yes', 'there'])

/** A section's own words: a post's title line and its More link are left out. */
const ownBody = (s: Section) =>
  s.body
    .split('\n')
    .filter((line, i) => !(i === 0 && line.trim() === s.heading.trim()) && !/^More: https?:\/\//.test(line))
    .join('\n')
    .trim()

/** Sections whose words are card fields (tagline, summary, key points), which the list check exempts. */
const isCardSection = (s: Section) => s.key === 'tab:Card' || s.key === 'tab:Listing'

const ctaLabel = (doc: Record<string, unknown>, field: string) => str(asDoc(doc[field])?.label).trim()

export const decide = (itemId: string, e: Entry, refs: Refs): Decision => {
  const d = e.doc
  const text = textOf(e)
  const sentences = sentencesOf(text)
  const meta = asDoc(d.meta) ?? {}
  const keyword = str(meta.primaryKeyword).trim()
  const faqs = rows(d.faqs)
  const named = (s: string) => has(s, e.name)
  // The entry, as headings, sections and the answer may name it.
  const subjectNames = [e.name, keyword, ...refs.catalogue, ...refs.terms].filter(Boolean)
  const namesSubject = (s: string) => subjectNames.some((n) => has(s, n))

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
      const unnamed = headings.find((h) => !namesSubject(h))
      return unnamed ? decided('fail', `"${unnamed}" has neither the entry name, the keyword nor a catalogue or terms name.`) : decided('pass')
    }
    case 'ex-sections-stand-alone': {
      for (const s of sectionsOf(e)) {
        const body = ownBody(s)
        const first = firstSentence(body)
        if (PRONOUN_START_WITH_THAT.test(body)) return decided('fail', `"${s.heading}" starts with ${body.split(/\s/)[0]}.`)
        if (!namesSubject(s.heading) && !namesSubject(first)) return decided('fail', `"${s.heading}" names its subject in neither its heading nor its first sentence.`)
      }
      return decided('pass')
    }
    case 'ex-no-outside-references': {
      const phrase = text.match(OUTSIDE)
      if (phrase) return decided('fail', `Says "${phrase[0]}".`)
      const ui = sentences.find((s) => UI_INSTRUCTION.test(s))
      if (ui) return decided('fail', `Tells the reader to act on the page: ${quoteShort(ui)}`)
      const pronoun = sentences.find((s) => PRONOUN_START.test(s))
      return pronoun ? decided('fail', `Starts with a pronoun: ${quoteShort(pronoun)}`) : decided('pass')
    }
    case 'ex-terms-defined': {
      for (const term of refs.terms) {
        const first = sentences.find((s) => wordMatch(s, term))
        if (!first) continue
        const t = escape(term)
        const defined = new RegExp(`${t}\\s+(is|are|means)\\b|${t}\\s*\\(|${t},\\s+(a|an|the)\\b`, 'i').test(first)
        if (!defined) return decided('fail', `"${term}" is first used without saying what it is: ${quoteShort(first)}`)
      }
      return decided('pass')
    }
    case 'ex-one-name':
      return judge()
    case 'ex-lists-for-enumerations': {
      for (const s of sectionsOf(e).filter((x) => !isCardSection(x))) {
        for (const sentence of sentencesOf(ownBody(s))) {
          const listed = sentence.replace(CLAUSE_COMMA, '').replace(/\band then\b/gi, 'then')
          const joins = (listed.match(/,/g)?.length ?? 0) + (listed.match(/\b(and|or|then)\b/gi)?.length ?? 0)
          if (joins >= 3) return decided('fail', `${joins} joins in one sentence: ${quoteShort(sentence)}`)
          if (joins >= 2 && words(sentence) > 25) return decided('fail', `${joins} joins in a ${words(sentence)}-word sentence: ${quoteShort(sentence)}`)
        }
      }
      return decided('pass')
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
    case 'ex-faq-answers-stand-alone': {
      if (!faqs.length) return decided('na', 'No FAQs.')
      for (const f of faqs) {
        const q = str(f.question)
        const a = str(f.answer).trim()
        if (/\b(it|this)\b/i.test(q)) return decided('fail', `The question says it or this: "${q}"`)
        if (/^(yes|no)\b|^\d/i.test(a)) continue
        const qWords = (q.match(/\p{L}+/gu) ?? []).map(lower).filter((w) => !COMMON.has(w))
        if (!qWords.some((w) => wordMatch(firstSentence(a), w))) return decided('fail', `The answer to "${q}" neither starts with yes, no or a number nor repeats a word from the question.`)
      }
      return decided('pass')
    }
    case 'ex-product-claims-exist':
    case 'hr-no-client-names':
      return judge()
    case 'ex-kb-answer-complete': {
      const answer = str(d.kbAnswer).trim()
      if (!answer) return decided('fail', 'Answer is empty.')
      const first = firstSentence(answer)
      if (!namesSubject(first)) return decided('fail', 'The first sentence of the answer names neither the entry, its keyword nor a catalogue or terms name.')
      return anyOf(first, refs.audiences) ? decided('pass') : decided('fail', 'The first sentence of the answer names no one from the audience list.')
    }
    case 'ex-kb-facts-checkable': {
      const facts = rows(d.kbFacts).map((r) => str(r.fact).trim())
      if (facts.length < 3) return decided('fail', `${facts.length} facts, fewer than three.`)
      const bad = facts.find((f) => f.length > 160 || sentencesOf(f).length > 1 || PRONOUN_START_WITH_THAT.test(f))
      return bad ? decided('fail', `Fact ${quoteShort(bad)} is not one short sentence with a noun first.`) : decided('pass')
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
    case 'en-audience-named': {
      // What a reader or the bot gets, not fields the entry stores but does not show.
      const found = anyOf(text, refs.audiences)
      return found ? decided('pass', `Names "${found}".`) : decided('fail', 'Names no one from the audience list.')
    }
    case 'en-hero-says-what': {
      if (!e.ownPage) return NO_OWN_PAGE
      const heading = str(d.heroHeading)
      if (!named(heading) && !has(heading, keyword)) return decided('fail', 'The hero heading has neither the entry name nor the keyword.')
      return anyOf(str(d.heroSubheading), refs.audiences) ? decided('pass') : decided('fail', 'The hero subheading names no one from the audience list.')
    }
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
    case 'en-concrete-example': {
      // The example as a whole: one section, its heading and its text.
      const names = [e.name, ...refs.catalogue]
      const example = sectionsOf(e).find((s) => {
        const all = `${s.heading}\n${s.body}`
        return anyOf(all, refs.channels) && /\d|"[^"]+"|“[^”]+”/.test(ownBody(s)) && names.some((n) => has(all, n))
      })
      return example ? decided('pass', `In "${example.heading}".`) : decided('fail', 'No section has a channel, a number or quoted item, and a NeuronCx name together.')
    }
    case 'en-card-summary': {
      const summary = str(d.summary).trim()
      if (!summary) return decided('fail', 'Summary is empty.')
      if (summary.length > 140) return decided('fail', `Summary is ${summary.length} characters.`)
      if (named(summary)) return decided('fail', 'Summary repeats the entry name.')
      return PRONOUN_START_WITH_THAT.test(summary) ? decided('fail', 'Summary starts with a pronoun.') : decided('pass')
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
      return hit ? decided('fail', `Uses "${hit[0]}".`) : decided('pass')
    }
    case 'hr-dpdp-not-hipaa': {
      if (/\bHIPAA\b/.test(e.raw)) return decided('fail', 'Mentions HIPAA.')
      const unframed = sentences.find((s) => DATA_PROTECTION.test(s) && !/\bDPDP\b/.test(s))
      return unframed ? decided('fail', `Mentions data protection without the DPDP Act: ${quoteShort(unframed)}`) : decided('pass')
    }
    case 'hr-no-patient-data': {
      const hit = e.raw.match(CONTACT_DATA)
      return hit ? decided('fail', `Contains "${hit[0]}".`) : judge()
    }
    case 'hr-claims-have-evidence': {
      const linksCustomer = e.links.some((l) => /\bcustomers\b/.test(l))
      // Only figures presented as results or market facts; a threshold or setting needs no source.
      const unsourced = sentences.find((s) => FIGURE.test(s) && (RESULT_WORDS.test(s) || FIGURE_OF.test(s)) && !SOURCE.test(s))
      return unsourced && !linksCustomer ? decided('fail', `A figure with no source: ${quoteShort(unsourced)}`) : decided('pass')
    }
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
      return named(desc) || has(desc, keyword) ? decided('pass') : decided('fail', 'SEO description has neither the name nor the keyword.')
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

/** hr-no-client-names, from the organisations a person listed: allowed only if listed. */
export const decideOrganisations = (names: string[], e: Entry, refs: Refs): { verdict: Verdict; note: string } => {
  const allowed = ['NeuronCx', 'NeuronCX', 'NCX', ...refs.customers, ...refs.integrations, ...refs.thirdParties].map(lower)
  const unknown = names.filter((n) => !allowed.includes(lower(n.trim())))
  return unknown.length ? { verdict: 'fail', note: `Names organisations not on any list: ${unknown.join(', ')}.` } : { verdict: 'pass', note: '' }
}

/** ex-product-claims-exist, from the NeuronCx names a person listed: each must exist. */
export const decideProductNames = (names: string[], e: Entry, refs: Refs): { verdict: Verdict; note: string } => {
  const known = [e.name, ...refs.catalogue, ...refs.terms].map(lower)
  const unknown = names.filter((n) => {
    const name = lower(n.trim())
    return !known.some((k) => k === name || (name.length >= 4 && (k.includes(name) || name.includes(k))))
  })
  return unknown.length ? { verdict: 'fail', note: `Names NeuronCx products that are not published records or terms: ${unknown.join(', ')}.` } : { verdict: 'pass', note: '' }
}
