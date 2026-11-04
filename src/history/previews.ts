import type { HistoryPreview } from './build'

/**
 * History's Preview link for collections without a Preview button of their
 * own: the website path of the version shown. The website loads that version
 * on these pages itself (neuroncx-website src/utilities/versionPreview.ts).
 * Every other collection with a Preview button uses it as is.
 */
export const HISTORY_PREVIEWS: Record<string, HistoryPreview> = {
  integrations: { path: (d) => (typeof d.slug === 'string' && d.slug ? `/integrations/${d.slug}` : null) },
  customers: { path: (d) => (typeof d.slug === 'string' && d.slug ? `/customers/${d.slug}` : null) },
}
