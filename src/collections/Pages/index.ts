import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { FeatureThread } from '../../blocks/FeatureThread/config'
import { ArticleGrid } from '../../blocks/ArticleGrid/config'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { ConversationHero } from '../../blocks/ConversationHero/config'
import { HeroFullBackground } from '../../blocks/HeroFullBackground/config'
import { HeroRightPlacement } from '../../blocks/HeroRightPlacement/config'
import { HeroWorkforceGrid } from '../../blocks/HeroWorkforceGrid/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import { validateHighlight } from './hooks/validateHighlight'
import { ClosingCTA } from '../../blocks/ClosingCTA/config'
import { HowItWorks } from '../../blocks/HowItWorks/config'
import { LogoWall } from '../../blocks/LogoWall/config'
import { StatHero } from '../../blocks/StatHero/config'
import { Benefits } from '../../blocks/Benefits/config'
import { Integrations } from '../../blocks/Integrations/config'
import { ProductSuite } from '../../blocks/ProductSuite/config'
import { ProductSuite2 } from '../../blocks/ProductSuite2/config'
import { ProductInAction } from '../../blocks/ProductInAction/config'
import { Testimonial } from '../../blocks/Testimonial/config'
import { WhatsappWidget } from '../../blocks/WhatsappWidget/config'
import { CaseStudyGrid } from '../../blocks/CaseStudyGrid/config'
import { CustomerDirectory } from '../../blocks/CustomerDirectory/config'
import { BentoGrid } from '../../blocks/BentoGrid/config'
import { DetailedProductSuite } from '../../blocks/DetailedProductSuite/config'
import { IntegrationsMarquee } from '../../blocks/IntegrationsMarquee/config'
import { FAQ } from '../../blocks/FAQ/config'
import { AgenticHero } from '../../blocks/AgenticHero/config'
import { AgenticFlowDemo } from '../../blocks/AgenticFlowDemo/config'
import { AgenticStats } from '../../blocks/AgenticStats/config'
import { AgenticCartsDemo } from '../../blocks/AgenticCartsDemo/config'
import { AgenticOrbit } from '../../blocks/AgenticOrbit/config'
import { AgenticEpisode } from '../../blocks/AgenticEpisode/config'
import { AgenticCases } from '../../blocks/AgenticCases/config'
import { AgenticClosing } from '../../blocks/AgenticClosing/config'
import { UseCases } from '../../blocks/UseCases/config'
import { ContactForm } from '../../blocks/ContactForm/config'
import { PartnerStrip } from '../../blocks/PartnerStrip/config'
import { ProblemStatement } from '../../blocks/ProblemStatement/config'
import { PlatformLayers } from '../../blocks/PlatformLayers/config'
import { PlatformLayersTwo } from '../../blocks/PlatformLayersTwo/config'
import { JourneyEngine } from '../../blocks/JourneyEngine/config'
import { ContextEngine } from '../../blocks/ContextEngine/config'
import { SolutionGrid } from '../../blocks/SolutionGrid/config'
import { TrustPanel } from '../../blocks/TrustPanel/config'
import { StatBand } from '../../blocks/StatBand/config'
import { withPresentation, withMinimalPresentation } from '@/fields/presentation'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
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
                withMinimalPresentation(HeroWorkforceGrid),
                withMinimalPresentation(AgenticHero),
                withMinimalPresentation(ConversationHero), // test 2: navy hero
                withMinimalPresentation(PlatformLayers), // test 2: navy stage
                withMinimalPresentation(TrustPanel), // test 2: navy by design
                withMinimalPresentation(StatBand), // test 1: crimson, edge to edge
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
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeValidate: [validateHighlight],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
