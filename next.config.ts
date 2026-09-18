import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { redirects } from './redirects'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
      // Direct S3 path-style URLs — bypasses Lambda so Next.js image optimizer
      // fetches source images from S3 directly, avoiding the 6 MB Lambda limit.
      ...(process.env.S3_REGION
        ? [
            {
              hostname: `s3.${process.env.S3_REGION}.amazonaws.com`,
              protocol: 'https' as const,
            },
          ]
        : []),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  // CloudFront in front of Amplify caches rendered HTML. The revalidatePage hook
  // calls revalidatePath, which only clears the Lambda instance that handled the
  // request — the CDN keeps serving the old page until a redeploy. These headers
  // cap how long that can happen: the CDN holds a page for 60s, then serves the
  // stale copy while fetching a fresh one for up to 5 minutes. Published edits
  // appear within about a minute without a deployment.
  // Excludes /admin and /api, which must never be cached.
  async headers() {
    return [
      {
        source: '/((?!admin|api|_next/static|_next/image).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
