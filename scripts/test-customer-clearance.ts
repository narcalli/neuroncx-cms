/**
 * Checks that "Show real name" is enforced by the CMS itself. Creates test
 * customers through the Local API, then reads them the way a visitor would,
 * over the public REST and GraphQL APIs of a running CMS and through a page
 * block and a testimonial link, and checks what comes back. Deletes
 * everything it created at the end.
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

// Fields a visitor must never get for a customer with Show real name off.
const HIDDEN = ['image', 'quotes', 'results', 'locations', 'city', 'description', 'heroHeading', 'heroSubheading', 'challenge', 'approach', 'storySections']
const present = (v: unknown) => v != null && !(Array.isArray(v) && v.length === 0)

const base = (n: string) => ({
  name: `ZT ${n}`,
  slug: `zt-${n.toLowerCase()}`,
  anonymisedName: `A test organisation (${n})`,
  summary: 'What changed for them, in one line.',
  sectors: sector ? [sector.id] : [],
  products: product ? [product.id] : [],
  image: media?.id,
  city: 'Testpur',
  locations: 12,
  description: rich('About the organisation.'),
  quotes: [
    { quote: 'First quote.', person: 'Asha', role: 'Director' },
    { quote: 'Second quote.', person: 'Ravi' },
  ],
  results: [
    { metric: 'No-shows', value: '-30%', baseline: '18%', period: 'Q2 2026', source: 'Their CRM' },
    { metric: 'Bookings', value: '+20%' },
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
const noSwitchFields = (d: any) => d && !('anonymisedName' in d && d.anonymisedName != null) && !('showName' in d && d.showName != null)

try {
  const named = await make({ ...base('Named'), showName: true, hasOwnPage: true, status: 'active' })
  const anon = await make({ ...base('Anon'), showName: false, hasOwnPage: false, status: 'active' })
  await make({ ...base('Past'), showName: true, status: 'past' })
  await make({ ...base('Draft'), showName: true, status: 'active' }, true)

  out.push('Validation (publishing through the Local API):')
  const refused = async (data: any, what: string) => {
    try {
      await make({ ...base(what.replace(/\W/g, '')), ...data })
      check(false, `${what}: was accepted`)
    } catch (e: any) {
      const msg = JSON.stringify(e?.data?.errors || e.message)
      check(msg.includes('Turn on Show real name and add a hero heading'), `${what}: refused with "Turn on Show real name and add a hero heading..."`)
    }
  }
  await refused({ hasOwnPage: true, showName: false }, 'own page with Show real name off')
  await refused({ hasOwnPage: true, showName: true, heroHeading: '' }, 'own page without a hero heading')

  // Public REST, as a visitor. The local copy of production has no customers,
  // so every entry listed here is a test one.
  const rest = await (await fetch(`${CMS}/api/customers?limit=50&depth=1`)).json()
  const find = (id: string) => rest.docs.find((d: any) => d.id === id)
  out.push(`Public REST /api/customers (visitor): ${rest.totalDocs} returned: ${rest.docs.map((d: any) => d.name).join(' | ')}`)
  check(rest.totalDocs === 2, 'past and draft customers not returned (2 of 4)')
  for (const d of rest.docs) check(noSwitchFields(d), `"${d.name}": no anonymisedName and no showName`)

  const n = find(String(named.id))
  check(n?.name === 'ZT Named' && n?.slug === 'zt-named' && n?.hasOwnPage === true, 'Show real name on: real name, slug and own page')
  check(present(n?.image) && n?.quotes?.length === 2 && n?.results?.length === 2, 'Show real name on: logo, both quotes and both results')
  check(n?.city === 'Testpur' && n?.locations === 12 && present(n?.description) && present(n?.challenge) && present(n?.storySections), 'Show real name on: city, locations, description and story')

  const a = find(String(anon.id))
  check(a?.name === 'A test organisation (Anon)', `Show real name off: anonymised name ("${a?.name}")`)
  check(a?.slug == null && a?.hasOwnPage === false, 'Show real name off: no slug, no own page')
  const leaked = HIDDEN.filter((k) => present(a?.[k]))
  check(leaked.length === 0, `Show real name off: none of the hidden fields${leaked.length ? ` (leaked: ${leaked.join(', ')})` : ''}`)

  // Searching or sorting by a hidden field must not reveal anything.
  const count = async (q: string) => (await (await fetch(`${CMS}/api/customers?${q}`)).json()).totalDocs
  check((await count('where[name][like]=ZT Anon')) === 0, 'searching a Show-real-name-off customer by real name finds nothing')
  check((await count('where[slug][equals]=zt-anon')) === 0, 'looking up a Show-real-name-off customer by slug finds nothing')
  check((await count('where[name][equals]=ZT Named')) === 1, 'searching a named customer by name still works')
  const sorted = await (await fetch(`${CMS}/api/customers?sort=-name`)).json()
  check(sorted.docs?.length === 2, 'sorting by a hidden field is ignored, not an error')

  // Public GraphQL, as a visitor.
  const gql = await (
    await fetch(`${CMS}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ Customers(limit: 50) { docs { id name slug hasOwnPage anonymisedName showName city locations image { id } quotes { quote } results { metric } heroHeading challenge description storySections { heading } } } }' }),
    })
  ).json()
  const g = gql?.data?.Customers?.docs || []
  out.push(`Public GraphQL Customers (visitor): ${g.length} returned: ${g.map((d: any) => d.name).join(' | ')}${gql.errors ? ` | errors: ${JSON.stringify(gql.errors).slice(0, 200)}` : ''}`)
  const gn = g.find((d: any) => d.id === String(named.id))
  const ga = g.find((d: any) => d.id === String(anon.id))
  check(g.length === 2, 'GraphQL: past and draft customers not returned')
  check(g.every(noSwitchFields), 'GraphQL: anonymisedName and showName null on every entry')
  check(gn?.name === 'ZT Named' && gn?.slug === 'zt-named' && present(gn?.image) && gn?.quotes?.length === 2 && gn?.results?.length === 2, 'GraphQL Show real name on: real name, slug, logo, quotes and results')
  check(ga?.name === 'A test organisation (Anon)' && ga?.slug == null && ga?.hasOwnPage === false && HIDDEN.every((k) => !present(ga?.[k])), 'GraphQL Show real name off: anonymised, none of the hidden fields')

  // Customers pulled into a page through a block and a testimonial link.
  const page = await payload.create({ collection: 'pages', overrideAccess: true, context: ctx, data: { title: 'ZT clearance page', slug: 'zt-clearance-page', _status: 'published', hero: { type: 'none' }, layout: [
    { blockType: 'caseStudyGrid', populateBy: 'selection', selectedDocs: [anon.id, named.id] },
    { blockType: 'testimonial', layout: 'carousel', quotes: [
      { quote: 'Typed quote one', attributionName: 'Someone', organisation: 'Org', linkedStory: anon.id },
      { quote: 'Typed quote two', attributionName: 'Someone else', organisation: 'Org', linkedStory: named.id },
    ] },
  ] } as any })
  created.push({ collection: 'pages', id: String(page.id) })
  const pr = await (await fetch(`${CMS}/api/pages?where[slug][equals]=zt-clearance-page&depth=2`)).json()
  const lay = pr.docs?.[0]?.layout || []
  const [gridAnon, gridNamed] = lay[0]?.selectedDocs || []
  const [linkAnon, linkNamed] = (lay[1]?.quotes || []).map((q: any) => q.linkedStory)
  out.push(`Through a page (visitor, REST depth 2): grid sees "${gridAnon?.name}" and "${gridNamed?.name}"; testimonial links see "${linkAnon?.name}" and "${linkNamed?.name}"`)
  check(gridAnon?.name === 'A test organisation (Anon)' && gridAnon?.slug == null && HIDDEN.every((k) => !present(gridAnon?.[k])) && noSwitchFields(gridAnon), 'page block, Show real name off: anonymised and stripped')
  check(gridNamed?.name === 'ZT Named' && gridNamed?.quotes?.length === 2 && noSwitchFields(gridNamed), 'page block, Show real name on: everything, minus the switch fields')
  check(linkAnon?.name === 'A test organisation (Anon)' && linkAnon?.hasOwnPage === false && noSwitchFields(linkAnon), 'testimonial link, Show real name off: anonymised, no own page')
  check(linkNamed?.name === 'ZT Named' && linkNamed?.hasOwnPage === true && noSwitchFields(linkNamed), 'testimonial link, Show real name on: real name, own page')

  // Server-side code still gets the record as saved.
  const raw = (await payload.find({ collection: 'customers', where: { slug: { equals: 'zt-anon' } }, overrideAccess: true })).docs[0] as any
  check(raw?.name === 'ZT Anon' && raw?.showName === false && raw?.anonymisedName, 'Local API (scripts, admin): the record as saved')
} finally {
  for (const r of created.reverse()) await payload.delete({ collection: r.collection, id: r.id, overrideAccess: true, context: ctx }).catch(() => {})
  out.push(`Cleanup: deleted ${created.length} test records`)
}

out.push(failures ? `${failures} check(s) FAILED` : 'All checks passed')
fs.writeSync(1, out.join('\n') + '\n')
process.exit(failures ? 1 : 0)
