import { defineSection, sectionBlockSlug } from './defineSection'

/**
 * The parts of an Integrations master record, as rows for its Page layout
 * (src/collections/IntegrationsMaster.ts). Each is a placement marker: it
 * has no fields of its own and draws the master's existing tab, so a row
 * only says where that part goes, and a layout holds it once. The website
 * draws them in neuroncx-website src/blocks/IntegrationsLanding/Component.tsx.
 */
const part = (key: string, label: string, reads: string[]) =>
  defineSection({ key, label, reads, requiredWhenOn: [], headingDefault: label, placement: true })

part('integrationsLogoStrip', 'Logo strip', ['logoStripOn', 'logoStrip'])
part('integrationsCategories', 'Integration sections', ['integrationSections', 'cardDesign', 'filter'])
part('integrationsFiveThings', 'Five things', ['fiveThingsHeading', 'fiveThings'])
part('integrationsFeeds', 'When feeds go wrong', ['whenFeedsGoWrongHeading', 'whenFeedsGoWrong'])
part('integrationsApiCard', 'API card', ['apiCard'])
part('integrationsFaq', 'FAQ', ['faqHeading', 'faqs'])
part('integrationsClosing', 'Closing panel', ['closing', 'cta'])

/** In the order the page draws them when its layout is empty. */
export const INTEGRATIONS_LANDING_SECTION_KEYS = [
  'integrationsLogoStrip',
  'integrationsCategories',
  'integrationsFiveThings',
  'integrationsFeeds',
  'integrationsApiCard',
  'integrationsFaq',
  'integrationsClosing',
] as const

export const INTEGRATIONS_CLOSING_SLUG = sectionBlockSlug('integrationsClosing')
