import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { CaseStudies } from './collections/CaseStudies'
import { Sectors } from './collections/Sectors'
import { Enquiries } from './collections/Enquiries'
import { Features } from './collections/Features'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './SiteSettings/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { withRag } from './rag/with-rag'
import { ragSyncDocTask } from './rag/tasks/sync-doc'
import { ragPurgeDocTask } from './rag/tasks/purge-doc'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {},
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
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  collections: [
    withRag(Pages),
    withRag(Posts),
    Media,
    Categories,
    Features,
    Users,
    Enquiries,
    Sectors,
    CaseStudies,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, SiteSettings],
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
  },
})
