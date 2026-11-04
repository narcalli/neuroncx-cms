import type { UIField } from 'payload'

/**
 * The Search check panel (fields/SearchCheckPanel.tsx): what search engines will
 * see of this entry, as warnings that never stop a save or a publish. The
 * integrations SEO check (collections/integrations/admin/SeoCheck.tsx) shows
 * the same warnings.
 */

const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0

export const searchWarnings = (
  values: { title?: unknown; description?: unknown; noIndex?: unknown },
  check: { title?: boolean; description?: boolean } = { title: true, description: true },
): string[] => [
  ...(values.noIndex === true ? ['Hidden from search engines: not listed in the sitemap.'] : []),
  ...(check.description && !filled(values.description)
    ? ["No meta description: search engines show the site's default one."]
    : []),
  ...(check.title && !filled(values.title) ? ['SEO title is empty: the page title is used.'] : []),
]

/** The panel, in the sidebar of an entry with an SEO tab and a page of its own. */
export const searchCheckField = (): UIField => ({
  name: 'searchCheck',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: { Field: '@/fields/SearchCheckPanel#SearchCheck' },
  },
})
