import type { Tab } from 'payload'

import { ComparisonTable } from '../../blocks/ComparisonTable/config'
import { defineContentCollection } from '../../content/defineContentCollection'
import { countedText } from '../../fields/counted'
import { blockGroupFields } from '../../fields/reuseBlock'
import { revalidateTopicFamily, revalidateTopicFamilyAfterDelete } from './revalidate'
import { TOPIC_DEFAULT_LAYOUT, TOPIC_SECTION_KEYS } from './sections'

/**
 * Industry topics: one page per topic under an industry, at
 * /{industry slug}/{topic slug}, such as /higher-education/fee-collection.
 * Each covers one capability for that industry: an overview (the feature
 * first), the steps, what gets saved to the record, an optional comparison,
 * and the agents, integrations and customers it links to.
 *
 * Its address follows the industry: renaming the industry moves every topic
 * (route { parent }, src/content/paths.ts).
 */

const topic: Tab = {
  label: 'Topic',
  fields: [
    countedText({
      name: 'overview',
      label: 'Overview',
      textarea: true,
      maxLength: 600,
      required: true,
      description: 'What this topic covers, feature first: what the platform does, then why it matters here.',
    }),
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      labels: { singular: 'Step', plural: 'Steps' },
      minRows: 2,
      maxRows: 8,
      admin: { initCollapsed: true, description: '2 to 8 steps, in order.' },
      fields: [
        countedText({ name: 'title', label: 'Title', maxLength: 60, required: true }),
        countedText({ name: 'description', label: 'Description', textarea: true, maxLength: 240 }),
      ],
    },
    {
      name: 'recorded',
      type: 'array',
      label: 'Recorded',
      labels: { singular: 'Field', plural: 'Fields' },
      maxRows: 10,
      admin: { initCollapsed: true, description: 'What gets saved to the record, and which system fills it. Up to 10.' },
      fields: [
        {
          type: 'row',
          fields: [
            { ...countedText({ name: 'field', label: 'Field', maxLength: 60, required: true }), admin: { width: '45%' } },
            {
              ...countedText({ name: 'source', label: 'Filled by', maxLength: 80, required: true }),
              admin: { width: '55%', description: 'The system or step that fills it, such as Lead management system.' },
            },
          ],
        },
      ],
    },
    {
      // The comparisonTable block's fields and validation, so the website
      // draws it with that block. Optional: left empty, the page has none.
      name: 'comparison',
      type: 'group',
      label: 'Comparison (optional)',
      admin: { description: 'Drawn with the Comparison table block. Leave empty for no comparison.' },
      fields: blockGroupFields(ComparisonTable),
    },
  ],
}

const links: Tab = {
  label: 'Links',
  fields: [
    {
      name: 'agents',
      type: 'relationship',
      label: 'Agents',
      relationTo: 'microApps',
      hasMany: true,
      admin: { sortOptions: 'order', description: 'The bot swarm agents this topic uses.' },
    },
    {
      name: 'integrations',
      type: 'relationship',
      label: 'Integrations',
      relationTo: 'integrations',
      hasMany: true,
      admin: { sortOptions: 'order', description: 'The systems this topic connects to.' },
    },
    {
      name: 'customers',
      type: 'relationship',
      label: 'Customers',
      relationTo: 'customers',
      hasMany: true,
      admin: { description: 'Customers who use it, shown only once cleared.' },
    },
  ],
}

export const IndustryTopics = defineContentCollection({
  slug: 'industryTopics',
  label: { singular: 'Industry topic', plural: 'Industry topics' },
  adminGroup: 'Industries',
  route: { parent: { collection: 'sectors', field: 'industry' } },
  groups: ['core', 'card', 'detail', 'ownPage', 'faq', 'whatsapp', 'kbase'],
  // The topic page sections (./sections.ts), with the shared FAQ and closing panel.
  sections: TOPIC_SECTION_KEYS,
  defaultLayout: TOPIC_DEFAULT_LAYOUT,
  // Every page block, as on a Page, and a hero block as the hero if chosen.
  siteBlocks: 'all',
  fields: {
    sidebar: [
      {
        name: 'industry',
        type: 'relationship',
        label: 'Industry (sets the address)',
        relationTo: 'sectors',
        required: true,
        admin: { description: 'The topic page sits under this industry: the industry slug, then this slug.' },
      },
      countedText({ name: 'stage', label: 'Stage (optional)', maxLength: 30, description: 'The stage this topic covers, such as Qualification.' }),
      {
        name: 'stageOrder',
        type: 'number',
        label: 'Stage order',
        required: true,
        min: 1,
        admin: { step: 1, description: "Its place among the industry's topics. Sets the order of the industry page's list and the next-stage link." },
      },
      {
        name: 'hideClusterFooter',
        type: 'checkbox',
        label: 'Hide cluster footer',
        defaultValue: false,
        admin: {
          description: "The links back to the industry page and on to the next stage, shown at the foot of every topic page.",
        },
      },
    ],
  },
  extraTabs: [
    { after: 'page', tab: topic },
    { after: 'page', tab: links },
  ],
  kb: { resolve: ['industry', 'agents', 'integrations'] },
  // Its industry's page and its sibling topics, before and after a move (./revalidate.ts).
  hooks: { afterChange: [revalidateTopicFamily], afterDelete: [revalidateTopicFamilyAfterDelete] },
})
