/**
 * The closing panel off by default (24 Oct 2026), as a pure function over a
 * stored record, so scripts/migrate-closing-off.ts applies it and tests can
 * check it. A microApps or hubs record whose closing switch is on gets it
 * turned off; every one that was on came from the hero design migration,
 * which switched them all on. Off or unset needs nothing.
 */
export const closingOffPatch = (doc: { showClosing?: unknown }): { showClosing?: false } =>
  doc.showClosing === true ? { showClosing: false } : {}
