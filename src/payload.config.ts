import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { CrmFeatures } from './collections/CrmFeatures'
import { MicroApps } from './collections/MicroApps'
import { buildHubs } from './collections/Hubs'
import { contentBlocks } from './content/sections/blocks'
import { waEndpoint } from './endpoints/wa'
import { Customers } from './collections/Customers'
import { Integrations } from './collections/Integrations'
import { IntegrationsMaster } from './collections/IntegrationsMaster'
import { Lists } from './collections/Lists'
import { ConnectionTypes, IntegrationCategories, Products } from './collections/IntegrationTaxonomies'
import { Sectors } from './collections/Sectors'
import { IndustryTopics } from './collections/IndustryTopics'
import { SharedContent } from './collections/SharedContent'
import { Enquiries } from './collections/Enquiries'
import { Features } from './collections/Features'
import { Media } from './collections/Media'
import { NcxPostContents } from './collections/NcxPostContents'
import { BenchmarkRuns } from './collections/BenchmarkRuns'
import { Rubrics } from './collections/Rubrics'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './SiteSettings/config'
import { WhatsappLists } from './WhatsappLists/config'
import { ContentStandards } from './ContentStandards/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { withRag } from './rag/with-rag'
import { applyHistory, ContentEvents } from './history'
import { ragSyncDocTask } from './rag/tasks/sync-doc'
import { ragPurgeDocTask } from './rag/tasks/purge-doc'
import { serializeTransactionCalls } from './db/serializeTransactionCalls'
import { EnquiryReads } from './collections/EnquiryReads'
import { applyReview } from './review'
import { withJobsAccess } from './access/jobsCollection'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The review queue (src/review/ReviewQueue.tsx), linked from the nav.
      afterNavLinks: ['@/review/ReviewNavLink#ReviewNavLink'],
      views: {
        reviewQueue: { Component: '@/review/ReviewQueue#ReviewQueue', path: '/review' },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: defaultLexical,
  // One transaction's database calls run one at a time (src/db/serializeTransactionCalls.ts).
  db: serializeTransactionCalls(
    mongooseAdapter({
      url: process.env.DATABASE_URL || '',
    }),
  ),
  // Layout sections and page blocks, referenced by slug from content collections' layout fields.
  blocks: contentBlocks(),
  // Read-only menus for the WhatsApp bot (src/endpoints/wa.ts).
  endpoints: [waEndpoint],
  // Every collection with drafts gets History and rollback to a draft (src/history).
  // Review workflow (src/review) on Pages, Posts and the content collections.
  collections: applyReview(applyHistory([
    Pages,
    Posts,
    Media,
    Categories,
    Features,
    Users,
    Enquiries,
    EnquiryReads,
    Sectors,
    IndustryTopics,
    SharedContent,
    Customers,
    IntegrationsMaster,
    withRag(Integrations),
    IntegrationCategories,
    ConnectionTypes,
    Products,
    Lists,
    CrmFeatures,
    MicroApps,
    // After every content collection: its pickers list them.
    buildHubs(),
    NcxPostContents,
    Rubrics,
    BenchmarkRuns,
    ContentEvents,
  ])),
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings, WhatsappLists, ContentStandards],
  plugins: [
    s3Storage({
      enabled: Boolean(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY),
      collections: { media: true },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'us-east-1',
        endpoint:
          process.env.S3_BUCKET && process.env.S3_REGION
            ? `https://s3.${process.env.S3_REGION}.amazonaws.com`
            : undefined,
        forcePathStyle: true,
      },
      bucket: process.env.S3_BUCKET || '',
      disableLocalStorage: true,
    }),
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const secret = process.env.CRON_SECRET
        if (!secret) return false
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [ragSyncDocTask, ragPurgeDocTask],
    // No creating, editing or deleting jobs through the API (src/access/jobsCollection.ts).
    jobsCollectionOverrides: ({ defaultJobsCollection }) => withJobsAccess(defaultJobsCollection),
  },
})
