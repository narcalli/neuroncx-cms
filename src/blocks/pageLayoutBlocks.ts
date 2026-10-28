import type { Block } from 'payload'

import { withMinimalPresentation, withPresentation } from '@/fields/presentation'

import { FeatureThread } from './FeatureThread/config'
import { ArticleGrid } from './ArticleGrid/config'
import { Archive } from './ArchiveBlock/config'
import { CallToAction } from './CallToAction/config'
import { Content } from './Content/config'
import { ConversationHero } from './ConversationHero/config'
import { HeroStack } from './HeroStack/config'
import { HeroFullBackground } from './HeroFullBackground/config'
import { HeroCustom } from './HeroCustom/config'
import { HeroRightPlacement } from './HeroRightPlacement/config'
import { HeroWorkforceGrid } from './HeroWorkforceGrid/config'
import { MediaBlock } from './MediaBlock/config'
import { ClosingCTA } from './ClosingCTA/config'
import { AudienceTabs } from './AudienceTabs/config'
import { RecordAnatomy } from './RecordAnatomy/config'
import { ClusterLinks } from './ClusterLinks/config'
import { ComparisonTable } from './ComparisonTable/config'
import { HowItWorks } from './HowItWorks/config'
import { HowItWorks2 } from './HowItWorks2/config'
import { LogoWall } from './LogoWall/config'
import { StatHero } from './StatHero/config'
import { Benefits } from './Benefits/config'
import { Integrations } from './Integrations/config'
import { ProductSuite } from './ProductSuite/config'
import { ProductSuite2 } from './ProductSuite2/config'
import { ProductInAction } from './ProductInAction/config'
import { Testimonial } from './Testimonial/config'
import { WhatsappWidget } from './WhatsappWidget/config'
import { CaseStudyGrid } from './CaseStudyGrid/config'
import { CustomerDirectory } from './CustomerDirectory/config'
import { BentoGrid } from './BentoGrid/config'
import { DetailedProductSuite } from './DetailedProductSuite/config'
import { IntegrationsMarquee } from './IntegrationsMarquee/config'
import { FAQ } from './FAQ/config'
import { AgenticHero } from './AgenticHero/config'
import { AgenticFlowDemo } from './AgenticFlowDemo/config'
import { AgenticStats } from './AgenticStats/config'
import { AgenticCartsDemo } from './AgenticCartsDemo/config'
import { AgenticOrbit } from './AgenticOrbit/config'
import { AgenticEpisode } from './AgenticEpisode/config'
import { SwarmDiagram } from './SwarmDiagram/config'
import { AgenticCases } from './AgenticCases/config'
import { AgenticClosing } from './AgenticClosing/config'
import { UseCases } from './UseCases/config'
import { ContactForm } from './ContactForm/config'
import { PartnerStrip } from './PartnerStrip/config'
import { ProblemStatement } from './ProblemStatement/config'
import { PlatformLayers } from './PlatformLayers/config'
import { PlatformLayersTwo } from './PlatformLayersTwo/config'
import { JourneyEngine } from './JourneyEngine/config'
import { ContextEngine } from './ContextEngine/config'
import { SolutionGrid } from './SolutionGrid/config'
import { TrustPanel } from './TrustPanel/config'
import { StatBand } from './StatBand/config'
import { IntegrationsLanding } from './IntegrationsLanding/config'

/**
 * Every block a Page's layout offers, each wrapped with its Appearance
 * options. Pages uses this list as it is; a hub's layout offers the same
 * blocks (src/content/sections/siteBlocks.ts, HUB_PAGE_BLOCKS), except those
 * that can never be in a layout.
 */
export const PAGE_LAYOUT_BLOCKS: Block[] = [
  ...[
    PartnerStrip,
    StatHero,
    LogoWall,
    ProblemStatement,
    JourneyEngine,
    ContextEngine,
    SolutionGrid,
    ProductSuite,
    ProductSuite2,
    ProductInAction,
    Testimonial,
    CaseStudyGrid,
    CustomerDirectory,
    BentoGrid,
    DetailedProductSuite,
    AgenticFlowDemo,
    AgenticStats,
    AgenticCartsDemo,
    AgenticOrbit,
    AgenticEpisode,
    SwarmDiagram,
    AgenticCases,
    // Was on the minimal set while it painted its own opaque
    // gradient. Wave 6 put that gradient on --ncx-cloud, which the
    // highlight remaps, so it no longer fails test 1.
    AgenticClosing,
    IntegrationsMarquee,
    UseCases,
    Benefits,
    Integrations,
    ContactForm,
    HowItWorks,
    HowItWorks2,
    ComparisonTable,
    AudienceTabs,
    RecordAnatomy,
    ClusterLinks,
    ClosingCTA,
    FeatureThread,
    ArticleGrid,
    CallToAction,
    Content,
    MediaBlock,
    Archive,
  ].map(withPresentation),
  // Two tests decide which side a block belongs on. A block gets the
  // minimal set if EITHER holds:
  //   1. It paints its own opaque background edge to edge over the
  //      wrapper, so Highlight (navy) is a visual no-op — the editor
  //      sets it, nothing changes, and the page's one highlight is
  //      spent. StatBand is this case: crimson covers the band
  //      completely.
  //   2. It is already dark or saturated by its own design, so
  //      Highlight reduces its internal hierarchy instead of raising
  //      it. TrustPanel is this case: its navy steps to navy-tint and
  //      lands on the same tone as its own cards.
  // A light band built from --ncx-* tokens does NOT fail test 1: the
  // highlight remaps those surfaces, so the block still works. Only
  // a background the highlight cannot reach counts.
  withMinimalPresentation(HeroFullBackground),
  withMinimalPresentation(HeroRightPlacement),
  withMinimalPresentation(HeroCustom), // test 1: its own background, edge to edge
  withMinimalPresentation(HeroWorkforceGrid),
  withMinimalPresentation(AgenticHero),
  withMinimalPresentation(ConversationHero), // test 2: navy hero
  withMinimalPresentation(HeroStack), // test 1: its own light ground, edge to edge
  withMinimalPresentation(PlatformLayers), // test 2: navy stage
  withMinimalPresentation(TrustPanel), // test 2: navy by design
  withMinimalPresentation(StatBand), // test 1: crimson, edge to edge
  withMinimalPresentation(IntegrationsLanding), // test 1: its own light hero, edge to edge
  // Neither test, but a third case: a fixed overlay. It never
  // occupies the band, so Highlight cannot reach its ground —
  // it only remaps the pill's own surfaces, leaving a white-on-
  // white ghost floating over a light page. Worse than a no-op.
  withMinimalPresentation(WhatsappWidget),
  // Self-contained: its own background and anchor fields already
  // cover what withPresentation/withMinimalPresentation would add,
  // so it isn't wrapped with either. See blocks/FAQ/config.ts.
  FAQ,
  // Has its own theme and anchorId fields, so it is not wrapped with
  // withPresentation either. Same reason as FAQ above.
  PlatformLayersTwo,
]
