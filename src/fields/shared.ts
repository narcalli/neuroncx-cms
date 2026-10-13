/**
 * The shared field groups from fields_reference.md, in one import:
 *
 *   import { cardTab, coreFields, ... } from '@/fields/shared'
 *
 * coreFields() and ownPage().sidebar go in a collection's fields; the tabs go
 * in one tabs field. Each export is a function, so every collection gets its
 * own copy of the fields.
 */
export { coreFields } from './core'
export { cardTab } from './card'
export { detailTab } from './detail'
export { seoTab } from './seo'
export { ownPage } from './ownPage'
export { faqTab } from './faq'
export { whatsappTab } from './whatsapp'
export { kbaseTab } from './kbase'
export { statusField } from './status'
export { plainText } from './validators/plainText'
