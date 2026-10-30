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
        clientProps: { kind: 'block', label: String(block.labels?.singular ?? block.slug) },
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
  'heroHarness',
  'heroWorkforceGrid',
  'agenticHero',
  'integrationsLanding',
  'faq',
] as const

/**
 * Page blocks that only make sense on a CMS page: cluster links lists the
 * pages under the page it sits on, and a hub has none.
 */
export const PAGES_ONLY = ['clusterLinks'] as const

/**
 * The other page blocks a hub's layout offers, beyond SITE_BLOCKS: every
 * block a Page's layout has, defined once in src/blocks/pageLayoutBlocks.ts
 * with the same Appearance options, except those that can never be in a
 * layout and those for pages only. Entry layouts keep SITE_BLOCKS only.
 */
export const HUB_PAGE_BLOCKS: Block[] = PAGE_LAYOUT_BLOCKS.filter(
  (b) =>
    !(NEVER_IN_LAYOUT as readonly string[]).includes(b.slug) &&
    !(PAGES_ONLY as readonly string[]).includes(b.slug) &&
    !SITE_BLOCKS.some((s) => s.slug === b.slug),
).map(withRowLabel)

/**
 * The hero blocks an entry page may start with when its Hero design is Hero
 * block from the layout (src/fields/heroDesign.ts). The first row holds one;
 * no other row may (src/fields/layout.ts).
 */
export const LAYOUT_HERO_BLOCKS = [
  'heroCustom',
  'conversationHero',
  'statHero',
  'heroFullBackground',
  'heroRightPlacement',
  'heroWorkforceGrid',
  'agenticHero',
  // Hero (harness loop) is left out until the website's entry page draws it
  // (neuroncx-website src/components/industry/IndustryEntryPage.tsx,
  // LAYOUT_HERO_BLOCKS). Add 'heroHarness' here and there together.
] as const

/** Every block that draws a page's H1: the layout heroes, and two that only their own pages use. */
export const HERO_BLOCKS = NEVER_IN_LAYOUT.filter((slug) => slug !== 'faq')

/**
 * The blocks an entry layout with siteBlocks 'all' adds to the hub's list:
 * the layout heroes, the plain faq block and the Pages-only blocks, each
 * refused where it would double the page's H1, FAQ data or closing panel
 * (src/fields/layout.ts). The integrations landing hero and the hero stack
 * are left out: they hold an H1 and are not layout heroes, so no row could
 * hold them.
 */
export const ENTRY_EXTRA_BLOCKS: Block[] = PAGE_LAYOUT_BLOCKS.filter(
  (b) =>
    !SITE_BLOCKS.some((s) => s.slug === b.slug) &&
    !HUB_PAGE_BLOCKS.some((s) => s.slug === b.slug) &&
    !(HERO_BLOCKS as readonly string[]).filter((h) => !(LAYOUT_HERO_BLOCKS as readonly string[]).includes(h)).includes(b.slug),
).map(withRowLabel)

/** The page blocks a hub's layout offers, by slug. */
export const HUB_LAYOUT_BLOCK_SLUGS: string[] = [...SITE_BLOCKS, ...HUB_PAGE_BLOCKS].map((b) => b.slug)

/**
 * The page blocks of an entry layout with siteBlocks 'all': the hub's list
 * and ENTRY_EXTRA_BLOCKS, so every block a Page's layout offers. All are
 * derived from src/blocks/pageLayoutBlocks.ts, so a new page block reaches
 * Pages, hubs and these entries without further wiring.
 */
export const ALL_LAYOUT_BLOCK_SLUGS: string[] = [...HUB_LAYOUT_BLOCK_SLUGS, ...ENTRY_EXTRA_BLOCKS.map((b) => b.slug)]
