/**
 * Creates (or updates) a DRAFT test page for the new `stackComparison`
 * block: slug `why-neuroncx-comparison`, title "Legacy stack vs NeuronCx".
 * Never publishes — always writes _status: 'draft'.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-stack-comparison-page.ts
 *
 * Runs only against a database on this machine. Add --remote to run it
 * anywhere else; it says which database first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const say = (s: string) => fs.writeSync(1, s + '\n')
const url = process.env.DATABASE_URL || ''
const host = url.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)

say(`Database: ${host || '(DATABASE_URL not set)'}`)
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}

const SLUG = 'why-neuroncx-comparison'
const TITLE = 'Legacy stack vs NeuronCx'

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const included = (texts: string[]) => texts.map((text) => ({ text }))

const cards = [
  {
    title: 'Legacy CRM',
    tagline: 'Tracks leads and deals for the sales team.',
    audienceLabel: 'Used by: sales team',
    highlighted: false,
    groups: [
      { heading: 'Built for', tone: 'included' as const, items: included(['Leads, deals and pipeline', 'Sales tasks and follow-ups', 'Sales reports and forecasts']) },
      { heading: 'Where it stops', tone: 'missing' as const, items: included(['WhatsApp through a connector or a higher tier', 'Repeat visits tracked as new deals', 'AI billed per use on top of the seat']) },
    ],
  },
  {
    title: 'Legacy CX',
    tagline: 'Handles tickets and chats for the support team.',
    audienceLabel: 'Used by: support team',
    highlighted: false,
    groups: [
      { heading: 'Built for', tone: 'included' as const, items: included(['Tickets and a shared inbox', 'Routing, queues and SLAs', 'Help articles and self-service']) },
      { heading: 'Where it stops', tone: 'missing' as const, items: included(['Call quality review is a separate tool', "Can't see what sales or campaigns promised", 'Bot and agent tools often bought apart']) },
    ],
  },
  {
    title: 'Legacy marketing automation',
    tagline: 'Sends campaigns to segments.',
    audienceLabel: 'Used by: marketing team',
    highlighted: false,
    groups: [
      { heading: 'Built for', tone: 'included' as const, items: included(['Segments and audiences', 'Journeys and campaign tests', 'Campaign analytics']) },
      { heading: 'Where it stops', tone: 'missing' as const, items: included(['Customer list copied from the CRM', 'Replies go to a separate inbox', 'Sees clicks, not whether the customer was served']) },
    ],
  },
  {
    title: 'NeuronCx',
    tagline: 'Sales, service and campaigns on one record, run by AI and people together.',
    audienceLabel: '',
    highlighted: true,
    badge: 'Integrated',
    cta: { label: 'Book a demo', url: '/contact' },
    groups: [
      {
        heading: 'The core of all three, plus',
        tone: 'plus' as const,
        items: included([
          'One customer record across sales, service and campaigns',
          'WhatsApp at the core: bot, agent, templates and campaigns together',
          'The bot qualifies, then hands the agent the full context',
          'Every call checked for quality, beside the customer it was about',
          'Repeat visits stay with the same customer',
          'AI workflows built on your own services, teams and rules',
          'Separate spaces for branches and departments, with a hub view',
          'Run it in your own cloud',
          'Audit trail and guardrails on every AI action',
        ]),
      },
    ],
  },
]

// Columns: Legacy CRM, Legacy CX, Legacy marketing (all default partial), NeuronCx (highlighted, default strong).
const columns = [
  { label: 'Legacy CRM', highlighted: false, defaultRating: 'partial' as const },
  { label: 'Legacy CX', highlighted: false, defaultRating: 'partial' as const },
  { label: 'Legacy marketing', highlighted: false, defaultRating: 'partial' as const },
  { label: 'NeuronCx', highlighted: true, defaultRating: 'strong' as const },
]

// Each row: 4 cell texts, in column order, with an explicit rating only
// where it differs from that column's default (everything else: 'inherit').
type RowSpec = { capability: string; cells: [string, string, string, string]; overrides?: Partial<Record<0 | 1 | 2 | 3, 'strong' | 'partial' | 'missing' | 'roadmap' | 'none'>> }

const rowSpecs: RowSpec[] = [
  {
    capability: 'Customer record',
    cells: ['Own copy of leads and deals', 'Own copy of contacts and tickets', 'Copy synced from the CRM', 'One shared record'],
  },
  {
    capability: 'WhatsApp',
    cells: ['Connector, higher tier or add-on', 'Add-on or messaging module', 'Built in or through a partner', 'Core channel'],
  },
  {
    capability: 'Replies and agent handoff',
    cells: ['Through a connector', 'Inside the helpdesk only', 'Some tools; others through partners', 'Bot and agent on one thread'],
  },
  {
    capability: 'Bot-to-agent context',
    cells: ['No native bot', 'Bot often a separate product', 'Rule-based flows', 'Bot qualifies, agent gets the full context'],
    overrides: { 0: 'missing' },
  },
  {
    capability: 'Call quality review',
    cells: ['Not included', 'Add-on or separate tool', 'Not included', 'Built in, beside the customer and transaction'],
    overrides: { 0: 'missing', 2: 'missing' },
  },
  {
    capability: 'Repeat visits',
    cells: ['Logged as new deals', 'Each issue is a new ticket', 'Events in a journey', 'Stay with the same customer'],
    overrides: { 1: 'missing', 3: 'roadmap' },
  },
  {
    capability: 'AI',
    cells: ['Add-on, billed per action or credit', 'Copilot add-on, billed per use', 'For content and segments', 'Workflows built on your own services, teams and rules'],
  },
  {
    capability: 'Branches and departments',
    cells: ['Roles and territories', 'Groups and departments', 'Workspaces', 'Separate spaces with a hub view'],
  },
  {
    capability: 'Hosting',
    cells: ["Vendor's cloud", "Vendor's cloud", "Vendor's cloud", 'Your own cloud, or ours'],
  },
]

const rows = rowSpecs.map((r) => ({
  capability: r.capability,
  cells: r.cells.map((text, i) => ({ text, rating: r.overrides?.[i as 0 | 1 | 2 | 3] || 'inherit' })),
}))

const stackComparisonBlock = {
  blockType: 'stackComparison',
  eyebrow: 'Why NeuronCx',
  heading: 'Three tools and the glue between them, or one platform',
  intro:
    'Most teams buy sales, service and campaigns separately, then pay again to connect them. NeuronCx runs all three on one customer record, with AI and people working the same conversation.',
  cards,
  table: {
    enabled: true,
    startOpen: false,
    cellStyle: 'tint',
    showLegend: true,
    columns,
    rows,
  },
}

const heroBlock = {
  blockType: 'statHero',
  headline: TITLE,
}

const pageData = {
  title: TITLE,
  slug: SLUG,
  hero: { type: 'none' },
  layout: [heroBlock, stackComparisonBlock],
  meta: {
    title: TITLE,
    description:
      'Most teams buy sales, service and campaigns separately, then pay again to connect them. See how NeuronCx compares.',
  },
  _status: 'draft',
}

/* ------------------------------------------------------------------ */
/* Write                                                                */
/* ------------------------------------------------------------------ */

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: SLUG } },
  draft: true,
  limit: 1,
  depth: 0,
  overrideAccess: true,
})

try {
  const doc = existing.docs[0]
    ? await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: pageData as never,
        draft: true,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'pages',
        data: pageData as never,
        draft: true,
        overrideAccess: true,
      })

  say(`\nSaved as draft: ${doc.id}`)
  say(`Status: ${doc._status}`)
  say(`Slug: ${doc.slug}`)
  say(`Admin edit: http://localhost:3001/admin/collections/pages/${doc.id}`)
  const previewSecret = process.env.PREVIEW_SECRET || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const params = new URLSearchParams({ path: `/${SLUG}`, previewSecret })
  say(`Local preview: ${siteUrl}/next/preview?${params.toString()}`)
} catch (err) {
  say('\nValidation or write error:')
  say(String((err as Error)?.message || err))
  if ((err as { data?: unknown }).data) say(JSON.stringify((err as { data?: unknown }).data, null, 2))
  process.exitCode = 1
}

process.exit(0)
