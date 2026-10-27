import type { Field } from 'payload'

import { defineSection, type DefaultLayoutRow, type SectionDefinition } from '../../content/sections/defineSection'
import { countedText } from '../../fields/counted'

/**
 * The industry page sections (sectors). Each draws from the industry entry
 * with the existing component of one page block (neuroncx-website
 * src/components/industry/IndustrySections.tsx). Each takes the automatic
 * heading override, an eyebrow and an intro, and of the Appearance options
 * only the background and the anchor ID. Rows marked Pending are never
 * drawn, and a section with nothing to show is not drawn.
 *
 * Highlight (navy) is allowed on the episode and the closing panel, one per
 * page, and on the episode only while the entry does not show the closing
 * panel (src/fields/layout.ts).
 */

const sectionFields = () => [
  countedText({ name: 'eyebrow', label: 'Eyebrow (optional)', maxLength: 60, description: 'The small line above the heading.' }),
  countedText({ name: 'intro', label: 'Intro (optional)', textarea: true, maxLength: 300, description: 'One or two sentences under the heading.' }),
]

/**
 * A section with an eyebrow and an intro besides the heading override, and
 * only the background and anchor ID of the Appearance options. Industry
 * topics use it too (src/collections/IndustryTopics/sections.ts).
 */
export const industrySection = (def: Omit<SectionDefinition, 'requiredWhenOn' | 'fields' | 'appearance'>, extra: Field[] = []) =>
  defineSection({ ...def, requiredWhenOn: [], fields: () => [...sectionFields(), ...extra], appearance: 'backgroundAndId' })

export const INDUSTRY_SECTIONS = [
  industrySection({ key: 'industryProblems', label: 'Industry problems', reads: ['problems'], headingDefault: 'What gets in the way' }),
  industrySection({ key: 'industryAudiences', label: 'Industry by team', reads: ['audiences'], headingDefault: 'What each team gets' }),
  industrySection({
    key: 'industryEpisode',
    label: 'Industry episode',
    reads: ['episodeName', 'episodePoints', 'keyDates', 'stats'],
    headingDefault: 'One episode, start to finish',
    navyAllowed: true,
  }),
  industrySection({ key: 'industryRoles', label: 'Industry roles', reads: ['roles', 'episodeName'], headingDefault: 'Who takes part' }),
  industrySection({
    key: 'industryRecord',
    label: 'Industry record',
    reads: ['recordLabel', 'fieldColumnLabel', 'sourceColumnLabel', 'entities'],
    headingDefault: 'What the record holds',
  }),
  industrySection({ key: 'industryComparison', label: 'Industry comparison', reads: ['columns', 'rows', 'footnote'], headingDefault: 'How it compares' }),
  // The interim platform sections (the Platform sections tab), each drawn
  // with the block whose fields its group holds.
  industrySection({ key: 'industryCarts', label: 'Carts (interim)', reads: ['carts'], headingDefault: 'Every course in one cart' }),
  industrySection({ key: 'industryEnquiry', label: 'Enquiry capture (interim)', reads: ['enquiryCapture'], headingDefault: 'Every enquiry captured' }),
  industrySection({ key: 'industryAnswers', label: 'Answers from content (interim)', reads: ['answersFromContent'], headingDefault: 'Answers from your own content' }),
  industrySection({ key: 'industryCampaigns', label: 'Campaigns (interim)', reads: ['campaigns'], headingDefault: 'Campaigns' }),
  industrySection({ key: 'industryReporting', label: 'Reporting (interim)', reads: ['reporting'], headingDefault: 'Reporting' }),
  industrySection({ key: 'industryCallQuality', label: 'Call quality (interim)', reads: ['callQuality'], headingDefault: 'Call quality' }),
  industrySection({ key: 'industryCampusSystems', label: 'Campus systems (interim)', reads: ['campusSystems'], headingDefault: 'Works with your campus systems' }),
  // Drawn from other collections, matched to this industry.
  industrySection({
    key: 'industryAgents',
    label: 'Industry agents',
    reads: ['verticals'],
    headingDefault: 'The agents that work here',
  }),
  industrySection({
    key: 'industryIntegrations',
    label: 'Industry integrations',
    reads: ['verticals'],
    headingDefault: 'Works with the systems you run',
  }),
  industrySection({ key: 'industryCustomers', label: 'Industry customers', reads: [], headingDefault: 'Who uses it' }),
  industrySection(
    { key: 'industryTopics', label: 'Industry topics', reads: [], headingDefault: 'Every stage, page by page' },
    [
      {
        name: 'extraPages',
        type: 'array',
        label: 'Extra pages',
        labels: { singular: 'Extra page', plural: 'Extra pages' },
        admin: {
          initCollapsed: true,
          description: 'Optional. Pages that belong with these topics but keep their own address. The topics under this industry are listed without being added here.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'page', type: 'relationship', label: 'Page', relationTo: 'pages', required: true, admin: { width: '50%' } },
              { ...countedText({ name: 'stage', label: 'Stage', maxLength: 30 }), admin: { width: '30%' } },
              { name: 'stageOrder', type: 'number', label: 'Stage order', min: 0, admin: { width: '20%', step: 1 } },
            ],
          },
        ],
      },
    ],
  ),
  industrySection(
    { key: 'shared', label: 'Shared content', reads: [], headingDefault: '' },
    [
      {
        name: 'item',
        type: 'relationship',
        label: 'Shared content',
        relationTo: 'sharedContent',
        required: true,
        admin: { description: 'One shared block, such as the trust panel every industry shows. A change to it reaches every page that places it.' },
      },
    ],
  ),
]

/** The industry sections, then the FAQ and the closing panel every content collection may use. */
export const INDUSTRY_SECTION_KEYS = [...INDUSTRY_SECTIONS.map((s) => s.key), 'faq', 'closing']

/**
 * The page every industry follows while Use page defaults is on. The two
 * Shared content rows place the hosting and implementation records
 * (src/collections/SharedContent), once they exist. The closing panel is
 * drawn only while Show the closing panel is on.
 */
export const INDUSTRY_DEFAULT_LAYOUT: DefaultLayoutRow[] = [
  'industryProblems',
  'industryAudiences',
  'industryEpisode',
  'industryRoles',
  'industryRecord',
  'industryCarts',
  'industryEnquiry',
  'industryAgents',
  'industryAnswers',
  'industryCampaigns',
  'industryReporting',
  'industryCallQuality',
  'industryComparison',
  'industryCampusSystems',
  'industryIntegrations',
  { key: 'shared', sharedContent: 'hosting' },
  { key: 'shared', sharedContent: 'implementation' },
  'industryTopics',
  'industryCustomers',
  'faq',
  'closing',
]
