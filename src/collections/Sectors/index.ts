import type { ArrayField, Block, Field, GroupField, Tab } from 'payload'

import { AgenticCartsDemo } from '../../blocks/AgenticCartsDemo/config'
import { AudienceTabs } from '../../blocks/AudienceTabs/config'
import { BentoGrid } from '../../blocks/BentoGrid/config'
import { ComparisonTable } from '../../blocks/ComparisonTable/config'
import { ContextEngine } from '../../blocks/ContextEngine/config'
import { PlatformLayersTwo } from '../../blocks/PlatformLayersTwo/config'
import { ProductSuite2 } from '../../blocks/ProductSuite2/config'
import { RecordAnatomy } from '../../blocks/RecordAnatomy/config'
import { defineContentCollection } from '../../content/defineContentCollection'
import { hidePendingRowsFromVisitors } from '../../content/pending'
import { countedText } from '../../fields/counted'
import { iconField } from '../../fields/icons'
import { blockGroupFields, copyField } from '../../fields/reuseBlock'
import { VERTICAL_OPTIONS } from '../../fields/verticals'
import { INDUSTRY_DEFAULT_LAYOUT, INDUSTRY_SECTION_KEYS } from './sections'

/**
 * Industries (Payload slug `sectors`, kept so customers.sectors and the case
 * study grid and customer directory filters keep working). An industry page
 * lives at the root of the site, /{slug}, built from the fields below: the
 * problems, the episode, key dates, stats and roles, a by-team section, the
 * record and a comparison. `name`, `slug` and `order` keep their names.
 *
 * Rows marked Pending stay in the CMS and draft preview only
 * (src/content/pending.ts).
 */

const named = (fields: Field[], name: string): Field => {
  const found = fields.find((f) => 'name' in f && f.name === name)
  if (!found) throw new Error(`sectors: the block has no ${name} field to reuse.`)
  return copyField(found)
}

/** A block's field, reused as it is but not required: an industry may leave the section out. */
const optional = <T extends Field>(field: T, overrides: Partial<T> = {}): T =>
  ({ ...field, required: false, ...overrides }) as T

const pending: Field = {
  name: 'pending',
  type: 'checkbox',
  label: 'Pending',
  defaultValue: false,
  admin: {
    description: 'Not confirmed yet: kept here, tagged Pending in draft preview, and left out of the page, WhatsApp and the knowledge base.',
  },
}

const rows = (
  name: string,
  label: string,
  labels: { singular: string; plural: string },
  limits: { minRows?: number; maxRows: number },
  fields: Field[],
  description?: string,
): ArrayField => ({
  name,
  type: 'array',
  label,
  labels,
  ...limits,
  admin: { initCollapsed: true, ...(description ? { description } : {}) },
  fields,
})

const industry: Tab = {
  label: 'Industry',
  fields: [
    rows(
      'problems',
      'Problems',
      { singular: 'Problem', plural: 'Problems' },
      { minRows: 2, maxRows: 4 },
      [
        countedText({ name: 'title', label: 'Title', maxLength: 70, required: true }),
        countedText({ name: 'description', label: 'Description', textarea: true, maxLength: 240 }),
      ],
      '2 to 4 problems this industry has, in its own words.',
    ),
    countedText({
      name: 'episodeName',
      label: 'Episode name',
      maxLength: 30,
      description: 'What one episode is called here, such as Admission or Patient visit.',
    }),
    rows(
      'episodePoints',
      'Episode points',
      { singular: 'Episode point', plural: 'Episode points' },
      { minRows: 3, maxRows: 10 },
      [
        countedText({ name: 'title', label: 'Title', maxLength: 40, required: true }),
        countedText({ name: 'caption', label: 'Caption', textarea: true, maxLength: 200 }),
        pending,
      ],
      '3 to 10 points in the episode, in order.',
    ),
    rows(
      'keyDates',
      'Key dates',
      { singular: 'Key date', plural: 'Key dates' },
      { maxRows: 6 },
      [countedText({ name: 'label', label: 'Label', maxLength: 40, required: true })],
      'Up to 6, such as Applications open.',
    ),
    rows(
      'stats',
      'Stats',
      { singular: 'Stat', plural: 'Stats' },
      { maxRows: 4 },
      [
        countedText({ name: 'value', label: 'Value', maxLength: 10, required: true, description: 'Such as 40% or 2x.' }),
        countedText({ name: 'label', label: 'Label', maxLength: 140, required: true }),
        pending,
      ],
      'Up to 4. Real, defensible figures only; mark one Pending until it is confirmed.',
    ),
    rows(
      'roles',
      'Roles',
      { singular: 'Role', plural: 'Roles' },
      { minRows: 2, maxRows: 6 },
      [
        countedText({ name: 'name', label: 'Name', maxLength: 40, required: true }),
        countedText({ name: 'caption', label: 'Caption', textarea: true, maxLength: 160 }),
        iconField(undefined, { description: 'Optional. From the shared icon library.' }),
      ],
      '2 to 6 people involved, such as Counsellor or Front desk.',
    ),
  ],
}

// The audienceTabs block's tabs: label, title, intro, points and links.
const byTeam: Tab = {
  label: 'By team',
  fields: [
    optional(named(AudienceTabs.fields, 'tabs') as ArrayField, {
      name: 'audiences',
      label: 'Audiences',
      labels: { singular: 'Audience', plural: 'Audiences' },
    }),
  ],
}

// The recordAnatomy block's record: its name, column headings and entities.
const columnHeadings = RecordAnatomy.fields.find(
  (f) => f.type === 'row' && f.fields.some((c) => 'name' in c && c.name === 'fieldColumnLabel'),
)
if (!columnHeadings) throw new Error('sectors: the recordAnatomy block has no column headings row to reuse.')
const record: Tab = {
  label: 'Record',
  fields: [
    named(RecordAnatomy.fields, 'recordLabel'),
    copyField(columnHeadings),
    optional(named(RecordAnatomy.fields, 'entities') as ArrayField),
  ],
}

// The comparisonTable block's table, with its validation (one highlighted
// column at most, one cell per column in every row).
const comparison: Tab = {
  label: 'Comparison',
  fields: [
    optional(named(ComparisonTable.fields, 'columns') as ArrayField),
    optional(named(ComparisonTable.fields, 'rows') as ArrayField),
    named(ComparisonTable.fields, 'footnote'),
  ],
}

/*
 * Platform sections (interim): each a group holding one page block's own
 * fields, so the website draws it with that block's component. The raw
 * block configs carry no Appearance fields (only the Pages layout adds them);
 * platformLayersTwo's own theme and anchorId, its equivalents, are left out
 * too, since the industry page sets those. Limits stay as they are. A
 * block's top-level required fields are not required here, so an industry
 * can be published with a section still empty; the page leaves it out.
 */
const platformSection = (name: string, label: string, block: Block): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { description: `Drawn with the ${block.labels?.singular ?? block.slug} block.` },
  // platformLayersTwo's own theme and anchorId are its Appearance equivalents.
  fields: blockGroupFields(block, ['theme', 'anchorId']),
})

const platformSections: Tab = {
  label: 'Platform sections (interim)',
  description: 'Interim. These move to the CRM features and call quality assessments collections once those have entries.',
  fields: [
    platformSection('carts', 'Carts', AgenticCartsDemo),
    platformSection('enquiryCapture', 'Enquiry capture', ContextEngine),
    platformSection('answersFromContent', 'Answers from content', ProductSuite2),
    platformSection('campaigns', 'Campaigns', BentoGrid),
    platformSection('reporting', 'Reporting', ProductSuite2),
    platformSection('callQuality', 'Call quality', PlatformLayersTwo),
    platformSection('campusSystems', 'Campus systems', ProductSuite2),
  ],
}

export const Sectors = defineContentCollection({
  slug: 'sectors',
  label: { singular: 'Industry', plural: 'Industries' },
  route: { entries: 'root' },
  groups: ['core', 'card', 'detail', 'ownPage', 'faq', 'whatsapp', 'kbase'],
  // The industry page sections (./sections.ts), all of them by default.
  sections: INDUSTRY_SECTION_KEYS,
  defaultLayout: INDUSTRY_DEFAULT_LAYOUT,
  fields: {
    sidebar: [
      countedText({
        name: 'menuLabel',
        label: 'Menu label (optional)',
        maxLength: 30,
        description: 'A shorter name for menus, such as Education. Empty uses the name.',
      }),
      {
        name: 'verticals',
        type: 'select',
        label: 'Verticals',
        hasMany: true,
        // The same list as an agent's Verticals (fields/verticals.ts).
        options: [...VERTICAL_OPTIONS],
        admin: { description: 'Which agents and integrations this industry pulls in.' },
      },
    ],
  },
  extraTabs: [
    { after: 'page', tab: industry },
    { after: 'page', tab: byTeam },
    { after: 'page', tab: record },
    { after: 'page', tab: comparison },
    { after: 'page', tab: platformSections },
  ],
  kb: { resolve: [] },
  hooks: { afterRead: [hidePendingRowsFromVisitors] },
})
