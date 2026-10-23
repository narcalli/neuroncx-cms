import type { CheckboxField } from 'payload'

/**
 * Whether a page ends with the closing panel (fields_reference.md section
 * 4): on by default. Off hides it on that one page; the panel stays the only
 * navy section wherever it is shown.
 */
export const showClosingField = (description: string): CheckboxField => ({
  name: 'showClosing',
  type: 'checkbox',
  label: 'Show the closing panel',
  defaultValue: true,
  admin: { description },
})

/** Whether a page shows its closing panel. Entries saved before the switch existed show it. */
export const showsClosing = (doc: { showClosing?: boolean | null } | null | undefined): boolean =>
  doc?.showClosing !== false
