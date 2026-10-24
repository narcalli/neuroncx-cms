import type { CheckboxField } from 'payload'

/**
 * Whether a page ends with the closing panel (fields_reference.md section
 * 4): off by default, switched on page by page, on a hub for the hub page
 * and on each entry for its own page. There is no site-wide switch. The
 * panel stays the only navy section wherever it is shown.
 */
export const showClosingField = (description: string): CheckboxField => ({
  name: 'showClosing',
  type: 'checkbox',
  label: 'Show the closing panel',
  defaultValue: false,
  admin: { description },
})

/** Whether a page shows its closing panel: only when its switch is on. */
export const showsClosing = (doc: { showClosing?: boolean | null } | null | undefined): boolean =>
  doc?.showClosing === true
