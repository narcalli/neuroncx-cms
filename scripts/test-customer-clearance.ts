/**
 * Checks that clearance is enforced by the CMS itself. Creates test
 * customers through the Local API, then reads them the way a visitor would,
 * over the public REST and GraphQL APIs of a running CMS, and checks what
 * comes back. Deletes everything it created at the end.
 *
 * Usage (from neuroncx-cms, with the CMS running on CMS_URL, default
 * http://localhost:3001):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/test-customer-clearance.ts
 *
 * Local database only: it refuses to run when DATABASE_URL is not on this
 * machine, because it creates and deletes records.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const CMS = (process.env.CMS_URL || 'http://localhost:3001').replace(/\/$/, '')
const out: string[] = []
let failures = 0
const check = (ok: boolean, what: string) => {
  if (!ok) failures++
  out.push(`  ${ok ? 'PASS' : 'FAIL'}  ${what}`)
}

if (!/(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || '')) {
  fs.writeSync(1, 'Refusing to run: DATABASE_URL is not a local database.\n')
  process.exit(1)
}

const payload = await getPayload({ config })
const ctx = { disableRevalidate: true, skipRag: true }
const rich = (t: string) => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, textFormat: 0, children: [{ type: 'text', version: 1, text: t, format: 0, detail: 0, mode: 'normal', style: '' }] }] },
})
const sector = (await payload.find({ collection: 'sectors', limit: 1, overrideAccess: true })).docs[0]
const product = (await payload.find({ collection: 'products', limit: 1, overrideAccess: true })).docs[0]
const media = (await payload.find({ collection: 'media', limit: 1, overrideAccess: true })).docs[0]
const today = new Date().toISOString()

const base = (n: string) => ({
  name: `ZT ${n}`,
  slug: `zt-${n.toLowerCase()}`,
  anonymisedName: `A test organisation (${n})`,
  summary: 'What changed for them, in one line.',
  tagline: 'Test tagline',
  sectors: sector ? [sector.id] : [],
  products: product ? [product.id] : [],
  image: media?.id,
  city: 'Testpur',
  locations: 12,
  description: rich('About the organisation.'),
  quotes: [
    { quote: 'A cleared quote.', person: 'Asha', role: 'Director', cleared: true },
    { quote: 'An uncleared quote.', person: 'Ravi', cleared: false },
  ],
  results: [
    { metric: 'No-shows', value: '-30%', baseline: '18%', period: 'Q2 2026', source: 'Their CRM', verified: true },
    { metric: 'Unverified claim', value: '+99%', verified: false },
  ],
  heroHeading: 'How they cut no-shows',
  heroSubheading: 'A subheading.',
  challenge: rich('The challenge.'),
  approach: rich('The approach.'),
  storySections: [{ product: product?.id, heading: 'A section', body: rich('Section body.') }],
})
const created: { collection: 'customers' | 'pages'; id: string }[] = []
const make = async (data: any, draft = false) => {
  const doc = await payload.create({ collection: 'customers', data: draft ? data : { ...data, _status: 'published' }, draft, overrideAccess: true, context: ctx })
  created.push({ collection: 'customers', id: String(doc.id) })
  return doc
}

try {
  // The test customers.
  await make({ ...base('Cleared'), hasOwnPage: true, status: 'active', clearance: { name: 'cleared', logo: 'cleared', quotes: 'cleared', figures: 'cleared', approvedBy: 'Test approver', approvedOn: today, evidence: 'Test record' } })
  await make({ ...base('Pending'), hasOwnPage: false, status: 'active', clearance: { name: 'pending', logo: 'cleared', quotes: 'cleared', figures: 'cleared', approvedBy: 'Test approver', approvedOn: today } })
  await make({ ...base('LogoOnly'), hasOwnPage: true, status: 'active', clearance: { name: 'cleared', logo: 'notAllowed', quotes: 'pending', figures: 'pending', approvedBy: 'Test approver', approvedOn: today } })
  await make({ ...base('Past'), status: 'past', clearance: { name: 'cleared', logo: 'cleared', quotes: 'cleared', figures: 'cleared', approvedBy: 'Test approver', approvedOn: today } })
  await make({ ...base('Draft'), status: 'active', clearance: { name: 'cleared', logo: 'cleared', quotes: 'cleared', figures: 'cleared', approvedBy: 'Test approver', approvedOn: today } }, true)

  out.push('Validation (publishing through the Local API):')
  const refused = async (data: any, expect: string, what: string) => {
    try {
      await make({ ...base(what.replace(/\W/g, '')), ...data })
      check(false, `${what}: was accepted`)
    } catch (e: any) {
      const msg = JSON.stringify(e?.data?.errors || e.message)
      check(msg.includes(expect), `${what}: refused with "${expect.slice(0, 70)}..."`)
    }
  }
  await refused({ hasOwnPage: true, clearance: { name: 'pending' } }, "Clear the client's name and add a hero heading", 'own page with the name pending')
  await refused({ hasOwnPage: true, heroHeading: '', clearance: { name: 'cleared', approvedBy: 'X', approvedOn: today } }, "Clear the client's name and add a hero heading", 'own page without a hero heading')
  await refused({ clearance: { name: 'cleared', logo: 'pending', quotes: 'pending', figures: 'pending' } }, 'Add who approved this', 'something cleared without approvedBy')
  await refused({ clearance: { name: 'cleared', approvedBy: 'X' } }, 'Add the approval date', 'something cleared without approvedOn')

  // Public REST, as a visitor.
  // The local copy of production has no customers, so every entry listed here is a test one.
  const rest = await (await fetch(`${CMS}/api/customers?limit=50&depth=1`)).json()
  const byName = (prefix: string) => rest.docs.find((d: any) => String(d.name).includes(prefix) || String(d.name).includes(`(${prefix})`))
  out.push(`Public REST /api/customers (visitor): ${rest.totalDocs} returned: ${rest.docs.map((d: any) => d.name).join(' | ')}`)
  check(!byName('Past'), 'past customer is not returned')
  check(!byName('Draft'), 'draft-only customer is not returned')
  for (const d of rest.docs) check(!('clearance' in d) && !('anonymisedName' in d), `"${d.name}": no clearance group and no anonymisedName`)

  const c = byName('Cleared')
  check(c?.name === 'ZT Cleared' && c?.slug === 'zt-cleared' && c?.hasOwnPage === true, 'cleared: real name, slug and own page kept')
  check(Boolean(c?.image) && c?.city === 'Testpur' && c?.locations === 12, 'cleared: logo, city and locations kept')
  check(c?.quotes?.length === 1 && c.quotes[0].cleared === true, 'cleared: only the cleared quote kept (1 of 2)')
  check(c?.results?.length === 1 && c.results[0].verified === true, 'cleared: only the verified result kept (1 of 2)')
  check(Boolean(c?.heroHeading && c?.challenge && c?.approach && c?.storySections?.length && c?.description), 'cleared: story and description kept')

  const p = byName('Pending')
  check(p?.name === 'A test organisation (Pending)', `pending: name replaced by anonymisedName ("${p?.name}")`)
  check(p?.slug == null && p?.hasOwnPage === false, 'pending: slug cleared, own page false')
  const leaked = ['image', 'quotes', 'results', 'locations', 'city', 'description', 'heroHeading', 'heroSubheading', 'challenge', 'approach', 'storySections'].filter((k) => p && p[k] != null && !(Array.isArray(p[k]) && !p[k].length))
  check(leaked.length === 0, `pending: no logo, quotes, figures, city, description or story${leaked.length ? ` (leaked: ${leaked.join(', ')})` : ''}`)
  check(p?.summary === 'What changed for them, in one line.', 'pending: summary still shown (it must be written anonymously)')

  const l = byName('LogoOnly')
  check(l?.name === 'ZT LogoOnly' && !l?.image, 'logo not allowed: name kept, logo removed')
  check(!l?.quotes?.length && !l?.results?.length && l?.locations == null, 'quotes and figures pending: quotes, results and locations removed')

  // Searching or sorting by a hidden field must not reveal anything.
  const count = async (q: string) => (await (await fetch(`${CMS}/api/customers?${q}`)).json()).totalDocs
  check((await count('where[name][like]=ZT Pending')) === 0, 'searching a pending customer by real name finds nothing')
  check((await count('where[slug][equals]=zt-pending')) === 0, 'looking up a pending customer by slug finds nothing')
  check((await count('where[city][equals]=Testpur')) === 2, 'searching a hidden field only matches cleared names (2 of 3)')
  check((await count('where[name][equals]=ZT Cleared')) === 1, 'searching a cleared customer by name still works')
  const sorted = await (await fetch(`${CMS}/api/customers?sort=-name`)).json()
  check(Array.isArray(sorted.docs) && sorted.docs.length === 3, 'sorting by a hidden field is ignored, not an error')

  // Public GraphQL, as a visitor.
  const gql = await (
    await fetch(`${CMS}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ Customers(limit: 50) { docs { name slug hasOwnPage city locations anonymisedName clearance { name approvedBy } image { id } quotes { quote cleared } results { metric verified } heroHeading } } }' }),
    })
  ).json()
  const gdocs = gql?.data?.Customers?.docs || []
  out.push(`Public GraphQL Customers (visitor): ${gdocs.length} returned: ${gdocs.map((d: any) => d.name).join(' | ')}${gql.errors ? ` | errors: ${JSON.stringify(gql.errors).slice(0, 200)}` : ''}`)
  const gp = gdocs.find((d: any) => d.name === 'A test organisation (Pending)')
  const gc = gdocs.find((d: any) => d.name === 'ZT Cleared')
  check(Boolean(gp) && gp.slug == null && gp.city == null && gp.image == null && !gp.quotes?.length && gp.heroHeading == null, 'GraphQL pending: anonymised, nothing uncleared')
  // GraphQL always answers a group with an object, so "removed" shows up as
  // every value being null rather than the group being missing.
  check(
    gdocs.every((d: any) => d.anonymisedName == null && (d.clearance == null || Object.values(d.clearance).every((v) => v == null))),
    'GraphQL: no clearance values and no anonymisedName on any entry',
  )
  check(gc?.quotes?.length === 1 && gc?.results?.length === 1, 'GraphQL cleared: uncleared quote and unverified result removed')
  check(!gdocs.some((d: any) => /Past|Draft/.test(d.name)), 'GraphQL: past and draft customers not returned')

  // A customer pulled into a page through a block, as a visitor.
  const pending = (await payload.find({ collection: 'customers', where: { slug: { equals: 'zt-pending' } }, overrideAccess: true })).docs[0]
  const page = await payload.create({ collection: 'pages', overrideAccess: true, context: ctx, data: { title: 'ZT clearance page', slug: 'zt-clearance-page', _status: 'published', hero: { type: 'none' }, layout: [
    { blockType: 'caseStudyGrid', populateBy: 'selection', selectedDocs: [pending.id] },
    { blockType: 'testimonial', layout: 'single', quotes: [{ quote: 'Typed quote', attributionName: 'Someone', organisation: 'Typed organisation', linkedStory: pending.id }] },
  ] } as any })
  created.push({ collection: 'pages', id: String(page.id) })
  const pr = await (await fetch(`${CMS}/api/pages?where[slug][equals]=zt-clearance-page&depth=2`)).json()
  const lay = pr.docs?.[0]?.layout || []
  const viaGrid = lay[0]?.selectedDocs?.[0]
  const viaQuote = lay[1]?.quotes?.[0]?.linkedStory
  out.push(`Pending customer pulled into a page (visitor, REST depth 2): grid sees "${viaGrid?.name}", testimonial sees "${viaQuote?.name}"`)
  check(viaGrid?.name === 'A test organisation (Pending)' && viaGrid?.slug == null && !viaGrid?.image && !('clearance' in (viaGrid || {})), 'through a page block: anonymised and stripped')
  check(viaQuote?.name === 'A test organisation (Pending)' && viaQuote?.hasOwnPage === false, 'through a testimonial link: anonymised, no own page')

  // Editors still see everything.
  const raw = (await payload.find({ collection: 'customers', where: { slug: { equals: 'zt-pending' } }, overrideAccess: true })).docs[0] as any
  check(raw?.name === 'ZT Pending' && raw?.clearance?.name === 'pending', 'Local API (scripts, admin): the record as saved')
} finally {
  for (const r of created.reverse()) await payload.delete({ collection: r.collection, id: r.id, overrideAccess: true, context: ctx }).catch(() => {})
  out.push(`Cleanup: deleted ${created.length} test records`)
}

out.push(failures ? `${failures} check(s) FAILED` : 'All checks passed')
fs.writeSync(1, out.join('\n') + '\n')
process.exit(failures ? 1 : 0)
