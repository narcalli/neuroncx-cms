import type { Block } from 'payload'

import { Benefits } from '../../blocks/Benefits/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { CaseStudyGrid } from '../../blocks/CaseStudyGrid/config'
import { Content } from '../../blocks/Content/config'
import { HowItWorks2 } from '../../blocks/HowItWorks2/config'
import { LogoWall } from '../../blocks/LogoWall/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { ProductInAction } from '../../blocks/ProductInAction/config'
import { StatBand } from '../../blocks/StatBand/config'
import { Testimonial } from '../../blocks/Testimonial/config'
import { TrustPanel } from '../../blocks/TrustPanel/config'
import { PAGE_LAYOUT_BLOCKS } from '../../blocks/pageLayoutBlocks'
import { withMinimalPresentation, withPresentation } from '../../fields/presentation'

/**
 * Page blocks every content collection's layout may use (foundation.md
 * section 5.3). Each is wrapped exactly as on Pages, so a block's data has
 * the same shape in both places and the website draws it with the same
 * component. StatBand and TrustPanel get the minimal appearance options, as
 * on Pages: both paint their own background.
 *
 * Never here: any hero block (an entry page's hero is fixed and holds the
 * one H1) and the plain faq block (the faq section replaces it, so FAQPage
 * data is not doubled).
 */

const withRowLabel = (block: Block): Block => ({
  ...block,
  admin: {
    ...block.admin,
    group: 'Page blocks',
    components: {
      ...block.admin?.components,
      Label: {
        path: '@/fields/LayoutField/RowLabel#LayoutRowLabel',
        clientProps: { label: String(block.labels?.singular ?? block.slug) },
      },
    },
  },
})

export const SITE_BLOCKS: Block[] = [
  ...[Testimonial, MediaBlock, ProductInAction, CaseStudyGrid, Benefits, CallToAction, Content, LogoWall, HowItWorks2].map(
    withPresentation,
  ),
  ...[StatBand, TrustPanel].map(withMinimalPresentation),
].map(withRowLabel)

/**
 * Block slugs no layout field may offer: every hero, including the
 * integrations landing hero (the page's hero holds its one H1), and the
 * plain faq block (the faq section or a hub's FAQ tab already sends the
 * FAQPage data).
 */
export const NEVER_IN_LAYOUT = [
  'statHero',
  'conversationHero',
  'heroStack',
  'heroFullBackground',
  'heroRightPlacement',
  'heroCustom',
  'heroWorkforceGrid',
  'agenticHero',
  'integrationsLanding',
  'faq',
] as const

/**
 * The other page blocks a hub's layout offers, beyond SITE_BLOCKS: every
 * block a Page's layout has, defined once in src/blocks/pageLayoutBlocks.ts
 * with the same Appearance options, except those that can never be in a
 * layout. Entry layouts keep SITE_BLOCKS only.
 */
export const HUB_PAGE_BLOCKS: Block[] = PAGE_LAYOUT_BLOCKS.filter(
  (b) =>
    !(NEVER_IN_LAYOUT as readonly string[]).includes(b.slug) && !SITE_BLOCKS.some((s) => s.slug === b.slug),
).map(withRowLabel)
