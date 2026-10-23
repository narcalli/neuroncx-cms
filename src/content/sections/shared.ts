import { defineSection } from './defineSection'

/**
 * Sections any content collection may allow, if it has the fields they read
 * (foundation.md section 5.3). Collections can set their own default
 * heading for one, such as "Other agents in {family}" for related.
 */

export const benefitsSection = defineSection({
  key: 'benefits',
  label: 'Benefits',
  reads: ['benefits'],
  requiredWhenOn: ['benefits'],
  headingDefault: 'Why teams use {name}',
})

export const useCasesSection = defineSection({
  key: 'useCases',
  label: 'Use cases',
  reads: ['useCases'],
  requiredWhenOn: ['useCases'],
  headingDefault: 'Where teams use it',
})

// Relationship sections are optional: with nothing linked they are not drawn.
export const integrationsSection = defineSection({
  key: 'integrations',
  label: 'Works with (integrations)',
  reads: ['integrations'],
  requiredWhenOn: [],
  headingDefault: 'Works with',
})

export const customersSection = defineSection({
  key: 'customers',
  label: 'Customers',
  reads: ['customers'],
  requiredWhenOn: [],
  headingDefault: 'Where {name} is live',
})

export const faqSection = defineSection({
  key: 'faq',
  label: 'FAQ',
  reads: ['faqs'],
  requiredWhenOn: ['faqs'],
  headingDefault: 'Questions about {name}',
})

// Falls back to other entries in the same grouping, so nothing is required.
export const relatedSection = defineSection({
  key: 'related',
  label: 'Related entries',
  reads: ['related'],
  requiredWhenOn: [],
  headingDefault: 'More like {name}',
})

// The heading and button come from the hub's closing until an editor sets one here.
export const closingSection = defineSection({
  key: 'closing',
  label: 'Closing panel',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'See {name} at work',
  navyAllowed: true,
})
