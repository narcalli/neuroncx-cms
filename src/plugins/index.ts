import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { pagePath } from '@/collections/Pages/nesting'
import { revalidateOnSite } from '@/hooks/revalidateOnSite'
import { apiKeysDraftOnlyPlugin } from './apiKeysDraftOnly'
import { ownerOrAdminInPerson } from '@/access/adminInPerson'
import { validateRedirectDestination } from '@/redirects/destination'

// The SEO title's Generate button. SEO titles carry the brand themselves (the
// website adds nothing to them), so: "Title | NeuronCx", and "Title | Blog"
// for posts. Content entries have a name, not a title.
export const generateTitle: GenerateTitle = async ({ doc, collectionConfig, req }) => {
  const own = String(doc?.title || doc?.name || '').trim()
  const settings = await req.payload.findGlobal({ slug: 'siteSettings', depth: 0, req }).catch(() => null)
  const brand = settings?.siteName?.trim() || 'NeuronCx'
  const suffix = collectionConfig?.slug === 'posts' ? 'Blog' : brand
  return own ? `${own} | ${suffix}` : brand
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  // Pillar and cluster pages: each page's parent and stored breadcrumbs
  // (src/collections/Pages/nesting.ts). The fields are defined in Pages.
  nestedDocsPlugin({
    collections: ['pages'],
    generateLabel: (_, doc) => String(doc.breadcrumbLabel || doc.title || ''),
    generateURL: (docs) => pagePath(docs),
  }),
  redirectsPlugin({
    collections: ['pages', 'posts'],
    // Permanent unless an editor marks it temporary (website bug 17). Not
    // required: older redirects have none, and a missing type is permanent.
    redirectTypes: ['308', '307'],
    redirectTypeFieldOverride: {
      label: 'Redirect type',
      required: false,
      defaultValue: '308',
      options: [
        { label: 'Permanent (most moves)', value: '308' },
        { label: 'Temporary (the old address comes back later)', value: '307' },
      ],
      admin: { description: 'Permanent tells search engines the move is for good. Temporary keeps the old address listed.' },
    },
    overrides: {
      // Live as soon as saved (no drafts): a content owner or admin in person,
      // never an author or a key. Redirects the CMS writes when an entry moves
      // (src/content/paths.ts) are saved by the server and are not affected.
      access: {
        read: () => true,
        create: ownerOrAdminInPerson,
        update: ownerOrAdminInPerson,
        delete: ownerOrAdminInPerson,
      },
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
          // A custom address: a path on this site, or a listed https host (src/redirects/destination.ts).
          if ('name' in field && field.name === 'to' && field.type === 'group') {
            return {
              ...field,
              fields: field.fields.map((sub) =>
                'name' in sub && sub.name === 'url' ? { ...sub, validate: validateRedirectDestination } : sub,
              ),
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateOnSite('redirects'), revalidateRedirects],
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
  // Last, so it reaches every collection with drafts, including any a plugin
  // above adds: API keys save drafts but never publish.
  apiKeysDraftOnlyPlugin,
]
