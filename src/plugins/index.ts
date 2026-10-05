import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Blog` : 'Blog'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  // Claude access over MCP. Read-only to start: each key must also be allowed
  // these capabilities in the admin, and writes stay off until enabled here.
  mcpPlugin({
    collections: {
      pages: {
        description: 'Website pages and their layout blocks.',
        enabled: { find: true, create: false, update: false, delete: false },
      },
      media: {
        description: 'Uploaded images and files.',
        enabled: { find: true, create: false, update: false, delete: false },
      },
    },
    globals: {
      header: {
        description: 'Site header: logo and menu.',
        enabled: { find: true, update: false },
      },
      footer: {
        description: 'Site footer: logo, tagline and link columns.',
        enabled: { find: true, update: false },
      },
    },
  }),
]
