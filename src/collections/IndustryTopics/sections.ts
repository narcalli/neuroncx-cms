import { industrySection } from '../Sectors/sections'

/**
 * The industry topic page sections. Each draws from the topic with the
 * existing component of one page block (neuroncx-website
 * src/components/industry/TopicSections.tsx), takes the automatic heading
 * override, an eyebrow and an intro, and of the Appearance options only the
 * background and the anchor ID. A section with nothing to show is not drawn.
 *
 * Shared content is the industry pages' section (../Sectors/sections.ts);
 * the FAQ and the closing panel are the shared sections every content
 * collection may use (src/content/sections/shared.ts). Highlight (navy) is
 * for the closing panel only.
 */

export const TOPIC_SECTIONS = [
  industrySection({ key: 'topicOverview', label: 'Topic overview', reads: ['overview'], headingDefault: 'What it covers' }),
  industrySection({ key: 'topicSteps', label: 'Topic steps', reads: ['steps'], headingDefault: 'Step by step' }),
  industrySection({ key: 'topicRecorded', label: 'Topic recorded', reads: ['recorded'], headingDefault: 'What gets recorded' }),
  industrySection({ key: 'topicComparison', label: 'Topic comparison', reads: ['comparison'], headingDefault: 'How it compares' }),
  industrySection({ key: 'topicAgents', label: 'Topic agents', reads: ['agents'], headingDefault: 'The agents that do it' }),
  industrySection({ key: 'topicIntegrations', label: 'Topic integrations', reads: ['integrations'], headingDefault: 'Works with' }),
]

export const TOPIC_SECTION_KEYS = [...TOPIC_SECTIONS.map((s) => s.key), 'shared', 'faq', 'closing']

/**
 * The page every topic follows while Use page defaults is on. Shared
 * content is placed by hand. The closing panel is drawn only while Show the
 * closing panel is on.
 */
export const TOPIC_DEFAULT_LAYOUT = [
  'topicOverview',
  'topicSteps',
  'topicRecorded',
  'topicAgents',
  'topicIntegrations',
  'topicComparison',
  'faq',
  'closing',
]
