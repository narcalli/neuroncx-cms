# Payload CMS Blog - Free Deployment Demo

A clean, minimal blog template showcasing Payload CMS deployed on **AWS Amplify** with **MongoDB Cloud** and **S3 storage**. This is an ideal starting point to demonstrate Payload CMS capabilities on AWS infrastructure without the complexity of forms, nested categories, or search features.

## What's Included

- **Landing page + Blog posts** - Public-facing content
- **Payload CMS admin panel** - Full content management
- **Media management** - Upload images directly to S3
- **Authentication & user roles** - Secure admin access
- **SEO optimized** - Meta tags, OpenGraph, sitemaps
- **Draft & published states** - Scheduled publishing support
- **Live preview** - See changes in real-time
- **AWS-ready** - Pre-configured for Amplify deployment

## What's Removed (for simplicity)

- ❌ Form builder plugin
- ❌ Search functionality
- ❌ Nested categories
- ❌ Seed data endpoint
- ❌ Demo admin UI components
- ❌ Vercel-specific code

**Free to add back later** - All removed features can be re-enabled from [Payload plugins](https://payloadcms.com/docs/plugins/overview).

## Quick Start - Local Development

### Prerequisites

- Node.js 20+
- pnpm or npm
- MongoDB local instance (or MongoDB Atlas)

### Setup

1. Clone and install:

```bash
git clone <your-repo>
cd blog-payloadcms-free-deployment
cp .env.example .env
pnpm install
```

2. Start MongoDB locally (or update `DATABASE_URL` in `.env`):

```bash
# Using Docker
docker run -d -p 27017:27017 mongo:latest

# Or install locally: brew install mongodb-community
brew services start mongodb-community
```

3. Start dev server:

```bash
pnpm dev
```

4. Open browser:
   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin

5. Follow on-screen prompts to create your first admin user and start creating content.

## Cloud Deployment - AWS Amplify

### Prerequisites

- AWS account (free tier eligible)
- MongoDB Cloud account (free tier available)
- GitHub repository

### Deploy in 5 Steps

For detailed step-by-step instructions, see [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md).

**Quick summary:**

1. **MongoDB Atlas** - Create free database cluster
2. **S3 bucket** - Create storage for media uploads via IAM user
3. **Generate secrets** - Create `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`
4. **AWS Amplify** - Connect GitHub repo and set environment variables
5. **Deploy** - Amplify auto-builds and deploys to `https://[app-id].amplifyapp.com`

```bash
# After deployment, access:
# Website:  https://your-app.amplifyapp.com
# Admin:    https://your-app.amplifyapp.com/admin
```

### Estimated Monthly Costs (Free Tier Demo)

| Service       | Usage          | Cost       |
| ------------- | -------------- | ---------- |
| Amplify       | <50GB/month    | **Free**   |
| MongoDB Cloud | <512MB storage | **Free**   |
| S3            | <1GB storage   | <$0.05     |
| **Total**     |                | **~$0.05** |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Amplify (Next.js)                    │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │   Admin Dashboard    │◄────►│   Next.js Frontend      │ │
│  │  (Payload CMS)       │      │  (Landing + Blog)       │ │
│  └──────────────────────┘      └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │                                   │
           │ Content/Auth                      │ Reads
           ▼                                   ▼
    ┌──────────────────────────────────────────────────────┐
    │         MongoDB Cloud (Database)                     │
    │  • Posts • Pages • Media metadata • Users            │
    └──────────────────────────────────────────────────────┘
           │
           │ Media files
           ▼
    ┌──────────────────────────────────────────────────────┐
    │         AWS S3 + (Optional) CloudFront CDN           │
    │  • Store blog images, uploads                        │
    │  • Serve with CDN for fast delivery                  │
    └──────────────────────────────────────────────────────┘
```

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (frontend)/        # Public website
│   │   └── (payload)/         # Admin panel
│   ├── collections/           # Data models
│   │   ├── Pages.ts
│   │   ├── Posts.ts
│   │   ├── Media.ts
│   │   ├── Categories.ts
│   │   └── Users.ts
│   ├── blocks/               # Layout builder blocks
│   │   ├── Content/
│   │   ├── CallToAction/
│   │   ├── Banner/
│   │   ├── Code/
│   │   ├── MediaBlock/
│   │   ├── ArchiveBlock/
│   │   └── RelatedPosts/
│   ├── plugins/              # Payload plugins config
│   ├── utilities/            # Helper functions
│   ├── components/           # React components
│   ├── Header/               # Header global
│   ├── Footer/               # Footer global
│   ├── heros/                # Hero variants
│   ├── payload.config.ts     # Payload CMS config (with S3)
│   └── environment.d.ts      # Env var types
├── public/                   # Static files
├── amplify.yml              # Amplify build config
├── next.config.ts           # Next.js config
├── package.json             # Dependencies
├── .env.example             # Environment template
└── AMPLIFY_DEPLOYMENT.md    # Deployment guide
```

## Collections & Globals

### Collections (Content)

- **Posts** - Blog articles with featured images, categories, authors
- **Pages** - Static pages (home, about, etc.) with flexible layouts
- **Media** - Images and files (stored in S3 in Amplify)
- **Categories** - Post taxonomy (simple, non-nested)
- **Users** - Authors and admin panel access

### Globals

- **Header** - Navigation menu
- **Footer** - Footer links

### Features

- **Draft & Publish** - Create drafts, schedule publishing
- **Live Preview** - See changes in real-time before publishing
- **SEO** - Built-in meta tags, OpenGraph, auto-generated sitemaps
- **Versions** - Keep revision history (up to 50 versions/doc)
- **Redirects** - Manage URL redirects when moving content

## Key Configuration Files

### `src/payload.config.ts`

Payload CMS configuration:

```typescript
// Includes S3 storage plugin (Amplify)
storagePlugin({
  collections: {
    media: {
      adapter: s3Adapter({
        config: {
          credentials: { accessKeyId, secretAccessKey },
          region: process.env.S3_REGION,
        },
        bucket: process.env.S3_BUCKET,
      }),
    },
  },
})
```

### `src/environment.d.ts`

TypeScript types for environment variables.

### `amplify.yml`

AWS Amplify build configuration - specifies build commands, artifacts, and caching.

### `.env.example` & `.env`

Environment variables:

- `DATABASE_URL` - MongoDB Atlas connection
- `PAYLOAD_SECRET` - JWT encryption key
- `NEXT_PUBLIC_SERVER_URL` - App URL (auto-set on Amplify)
- `AWS_*` - S3 credentials
- `S3_BUCKET` - S3 bucket name

## Environment Variables

### Required for AWS Amplify

```env
# Database (MongoDB Cloud)
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db

# Security
PAYLOAD_SECRET=<48-char hex string>
CRON_SECRET=<48-char hex string>
PREVIEW_SECRET=<48-char hex string>

# Server URL (auto-set by Amplify)
NEXT_PUBLIC_SERVER_URL=https://your-app.amplifyapp.com

# AWS S3
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<from IAM user>
S3_SECRET_ACCESS_KEY=<from IAM user>
S3_BUCKET=your-bucket-name

```

Store secrets in AWS Secrets Manager or Amplify environment variables - **never commit to git**.

## Customization

### Add Search Back

```bash
pnpm add @payloadcms/plugin-search
```

Then re-add to `src/plugins/index.ts`.

### Add Forms

```bash
pnpm add @payloadcms/plugin-form-builder
```

### Change Branding

- Update site title in `src/plugins/index.ts` (`generateTitle` function)
- Update Open Graph in `src/utilities/mergeOpenGraph.ts`
- Customize header/footer in CMS: `/admin/globals/header`, `/admin/globals/footer`

### Add Custom Domain

In Amplify console > App settings > Domain management, add your custom domain.

## Troubleshooting

### "Module not found" errors after changes?

```bash
pnpm run generate:types
pnpm run generate:importmap
```

### Images not showing in production?

1. Check S3 bucket policy allows public read access
2. Verify IAM user has `s3:PutObject` permission
3. Check `AWS_*` environment variables in Amplify
4. See [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md#troubleshooting)

### Admin panel won't load?

1. Check `DATABASE_URL` is correct
2. Verify MongoDB Atlas IP whitelist includes Amplify IPs
3. Check browser console for errors (`/admin` with DevTools open)

### Amplify build failing?

Check deployment logs: Amplify console > Deployments > [Latest] > Build logs

Common causes:

- Missing environment variables
- Invalid `DATABASE_URL`
- S3 bucket doesn't exist or IAM user lacks permissions
- Node.js version mismatch

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] S3 bucket created with public read policy
- [ ] IAM user created with S3 permissions
- [ ] Secrets generated and stored (never commit!)
- [ ] GitHub repo ready with `amplify.yml`
- [ ] Amplify app created and connected to GitHub
- [ ] Environment variables set in Amplify console
- [ ] First deployment successful
- [ ] Admin user created via `/admin`
- [ ] Sample content created
- [ ] Custom domain configured (optional)

## Production Considerations

### Security

- Keep all secrets in AWS Secrets Manager or Amplify env vars
- Enable HTTPS (automatic on Amplify)
- Rotate `PAYLOAD_SECRET` periodically
- Set strong passwords for MongoDB Atlas and admin users
- Use restrictive IAM policies (least privilege)

### Performance

- Enable CloudFront CDN for images
- Use Amplify caching for static content
- Monitor Amplify Analytics > Metrics
- Test with browser DevTools Throttling

### Reliability

- Enable MongoDB Atlas backups (automatic on paid tier)
- Set up CloudWatch alarms for high error rates
- Monitor Amplify build and deployment success
- Keep Node.js and dependencies updated

### Cost

- Monitor AWS Cost Explorer
- Use reserved capacity for predictable workloads
- Clean up unused resources (buckets, distributions)
- Free tier limits: 50 GB transfer/month on Amplify

## Learn More

- [Payload CMS Docs](https://payloadcms.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [AWS Amplify Docs](https://docs.amplify.aws)
- [MongoDB Cloud Docs](https://docs.mongodb.com/cloud)

## Support

For issues or questions:

1. Check [AMPLIFY_DEPLOYMENT.md](./AMPLIFY_DEPLOYMENT.md#troubleshooting)
2. Review [Payload CMS Docs](https://payloadcms.com/docs)
3. Open an issue on GitHub

## License

MIT

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel and unpublished content. See [Access Control](#access-control) for more details.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/3.x/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Posts

  Posts are used to generate blog posts, news articles, or any other type of content that is published over time. All posts are layout builder enabled so you can generate unique layouts for each post using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Posts are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Pages

  All pages are layout builder enabled so you can generate unique layouts for each page using layout-building blocks, see [Layout Builder](#layout-builder) for more details. Pages are also draft-enabled so you can preview them before publishing them to your website, see [Draft Preview](#draft-preview) for more details.

- #### Media

  This is the uploads enabled collection used by pages, posts, and projects to contain media like images, videos, downloads, and other assets. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

- #### Categories

  A taxonomy used to group posts together. Categories can be nested inside of one another, for example "News > Technology". See the official [Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) for more details.

### Globals

See the [Globals](https://payloadcms.com/docs/configuration/globals) docs for details on how to extend this functionality.

- `Header`

  The data required by the header on your front-end like nav links.

- `Footer`

  Same as above but for the footer of your site.

## Access control

Basic access control is setup to limit access to various content based based on publishing status.

- `users`: Users can access the admin panel and create or edit content.
- `posts`: Everyone can access published posts, but only users can create, update, or delete them.
- `pages`: Everyone can access published pages, but only users can create, update, or delete them.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## Layout Builder

Create unique page layouts for any type of content using a powerful layout builder. This template comes pre-configured with the following layout building blocks:

- Hero
- Content
- Media
- Call To Action
- Archive

Each block is fully designed and built into the front-end website that comes with this template. See [Website](#website) for more details.

## Lexical editor

A deep editorial experience that allows complete freedom to focus just on writing content without breaking out of the flow with support for Payload blocks, media, links and other features provided out of the box. See [Lexical](https://payloadcms.com/docs/rich-text/overview) docs.

## Draft Preview

All posts and pages are draft-enabled so you can preview them before publishing them to your website. To do this, these collections use [Versions](https://payloadcms.com/docs/configuration/collections#versions) with `drafts` set to `true`. This means that when you create a new post, project, or page, it will be saved as a draft and will not be visible on your website until you publish it. This also means that you can preview your draft before publishing it to your website. To do this, we automatically format a custom URL which redirects to your front-end to securely fetch the draft version of your content.

Public content routes for pages and posts are rendered dynamically, so published edits are visible immediately on the next request.

For more details on how to extend this functionality, see the official [Draft Preview Example](https://github.com/payloadcms/payload/tree/3.x/examples/draft-preview).

## Live preview

In addition to draft previews you can also enable live preview to view your end resulting page as you're editing content with full support for SSR rendering. See [Live preview docs](https://payloadcms.com/docs/live-preview/overview) for more details.

## On-demand Revalidation

We've added hooks to collections and globals so cached frontend surfaces (like globals and sitemap routes) are updated via on-demand revalidation in Next.js.

> Note: if an image has been changed, for example it's been cropped, you will need to republish the page it's used on in order to be able to revalidate the Nextjs image cache.

## SEO

This template comes pre-configured with the official [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for complete SEO control from the admin panel. All SEO data is fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Search

This template also pre-configured with the official [Payload Search Plugin](https://payloadcms.com/docs/plugins/search) to showcase how SSR search features can easily be implemented into Next.js with Payload. See [Website](#website) for more details.

## Redirects

If you are migrating an existing site or moving content to a new URL, you can use the `redirects` collection to create a proper redirect from old URLs to new ones. This will ensure that proper request status codes are returned to search engines and that your users are not left with a broken link. This template comes pre-configured with the official [Payload Redirects Plugin](https://payloadcms.com/docs/plugins/redirects) for complete redirect control from the admin panel. All redirects are fully integrated into the front-end website that comes with this template. See [Website](#website) for more details.

## Jobs and Scheduled Publish

We have configured [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish) which uses the [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) in order to publish or unpublish your content on a scheduled time. The tasks are run on a cron schedule and can also be run as a separate instance if needed.

> Note: When deployed on Vercel, depending on the plan tier, you may be limited to daily cron only.

## Website

This template includes a beautifully designed, production-ready front-end built with the [Next.js App Router](https://nextjs.org), served right alongside your Payload app in a instance. This makes it so that you can deploy both your backend and website where you need it.

Core features:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/3.x/packages/admin-bar)
- [TailwindCSS styling](https://tailwindcss.com/)
- [shadcn/ui components](https://ui.shadcn.com/)
- User Accounts and Authentication
- Fully featured blog
- Publication workflow
- Dark mode
- Pre-made layout building blocks
- SEO
- Search
- Redirects
- Live preview

### Cache

Although Next.js includes a robust set of caching strategies out of the box, Payload Cloud proxies and caches all files through Cloudflare using the [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). This means that Next.js caching is not needed and is disabled by default. If you are hosting your app outside of Payload Cloud, you can easily reenable the Next.js caching mechanisms by removing the `no-store` directive from all fetch requests in `./src/app/_api` and then removing all instances of `export const dynamic = 'force-dynamic'` from pages files, such as `./src/app/(pages)/[slug]/page.tsx`. For more details, see the official [Next.js Caching Docs](https://nextjs.org/docs/app/building-your-application/caching).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start). Then [Seed](#seed) the database with a few pages, posts, and projects.

### Working with Postgres

Postgres and other SQL-based databases follow a strict schema for managing your data. In comparison to our MongoDB adapter, this means that there's a few extra steps to working with Postgres.

Note that often times when making big schema changes you can run the risk of losing data if you're not manually migrating it.

#### Local development

Ideally we recommend running a local copy of your database so that schema updates are as fast as possible. By default the Postgres adapter has `push: true` for development environments. This will let you add, modify and remove fields and collections without needing to run any data migrations.

If your database is pointed to production you will want to set `push: false` otherwise you will risk losing data or having your migrations out of sync.

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) are essentially SQL code versions that keeps track of your schema. When deploy with Postgres you will need to make sure you create and then run your migrations.

Locally create a migration

```bash
pnpm payload migrate:create
```

This creates the migration files you will need to push alongside with your new configuration.

On the server after building and before running `pnpm start` you will want to run your migrations

```bash
pnpm payload migrate
```

This command will check for any migrations that have not yet been run and try to run them and it will keep a record of migrations that have been run in the database.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

### Seed

To seed the database with a few pages, posts, and projects you can click the 'seed database' link from the admin panel.

The seed script will also create a demo user for demonstration purposes only:

- Demo Author
  - Email: `demo-author@payloadcms.com`
  - Password: `password`

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.
1. When you're ready to go live, see Deployment below for more details.

### Deploying to Vercel

This template can also be deployed to Vercel for free. You can get started by choosing the Vercel DB adapter during the setup of the template or by manually installing and configuring it:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

We also support Vercel's blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

There is also a simplified [one click deploy](https://github.com/payloadcms/payload/tree/3.x/templates/with-vercel-postgres) to Vercel should you need it.

### Self-hosting

Before deploying your app, you need to:

1. Ensure your app builds and serves in production. See [Production](#production) for more details.
2. You can then deploy Payload as you would any other Node.js or Next.js application either directly on a VPS, DigitalOcean's Apps Platform, via Coolify or more. More guides coming soon.

You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
