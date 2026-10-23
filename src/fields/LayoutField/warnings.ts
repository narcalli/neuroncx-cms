/**
 * Warnings shown above an entry's layout. They never stop a save. No
 * imports, so the admin's client components can use it.
 */

/** The closing section's block slug (sectionBlockSlug('closing')). */
export const CLOSING_BLOCK = 'closingSection'

export const layoutWarnings = (blockTypes: (string | undefined)[]): string[] => {
  const at = blockTypes.indexOf(CLOSING_BLOCK)
  return at >= 0 && at !== blockTypes.length - 1
    ? ['The closing panel is not the last row. It normally ends the page.']
    : []
}
