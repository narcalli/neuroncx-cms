/**
 * Whether the drawing's chips and loop label fit, in both layouts of the
 * drawing (neuroncx-website src/blocks/HeroHarness/geometry.ts, which uses
 * the same numbers). Chips and the loop label are set in IBM Plex Mono,
 * whose every letter is 0.6 of the font size wide, so their widths are
 * known from the number of letters alone.
 */

/** Letter width in the drawing's monospaced font, at a font size, plus any letter spacing. */
export const monoWidth = (text: string, fontSize: number, letterSpacingEm = 0): number =>
  text.length * fontSize * (0.6 + letterSpacingEm)

export type ChipRowSpec = { fontSize: number; pad: number; gap: number; maxWidth: number; maxRows: number }

/** The chip rows, laid out as the drawing does: left to right, a new row when the next chip would pass the edge. */
export const chipRows = (labels: string[], spec: ChipRowSpec, width = (s: string) => monoWidth(s, spec.fontSize)): number => {
  let rows = labels.length ? 1 : 0
  let x = 0
  for (const label of labels) {
    const w = Math.ceil(width(label)) + spec.pad * 2
    if (x > 0 && x + w > spec.maxWidth) {
      rows += 1
      x = 0
    }
    x += w + spec.gap
  }
  return rows
}

/** True when every chip fits its row and the rows fit the box. */
export const chipsFit = (labels: string[], spec: ChipRowSpec): boolean =>
  labels.every((l) => monoWidth(l, spec.fontSize) + spec.pad * 2 <= spec.maxWidth) && chipRows(labels, spec) <= spec.maxRows

/** The ontology chips: two rows at most inside the ontology box, in both layouts. */
export const ONTOLOGY_CHIPS = {
  landscape: { fontSize: 10.5, pad: 7, gap: 6, maxWidth: 216, maxRows: 2 },
  portrait: { fontSize: 10, pad: 5, gap: 4, maxWidth: 130, maxRows: 2 },
} satisfies Record<string, ChipRowSpec>

/** The Customer 360 chips: one row, beside the label on wide screens and under it on phones. */
export const CUSTOMER_360_CHIPS = {
  landscape: { fontSize: 10.5, pad: 9, gap: 8, maxWidth: 400, maxRows: 1 },
  portrait: { fontSize: 10, pad: 8, gap: 6, maxWidth: 286, maxRows: 1 },
} satisfies Record<string, ChipRowSpec>

/** The loop label: on wide screens two lines in the lane left of the drawing, each at most this wide. */
export const LOOP_LINE_WIDTH = 114
export const LOOP_FONT = { fontSize: 10.5, letterSpacingEm: 0.03 }

/** The loop label's two lines on wide screens: the first half of the words, then the rest. */
export const loopLines = (label: string): string[] => {
  const words = label.trim().split(/\s+/).filter(Boolean)
  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')].filter(Boolean)
}

export const loopFits = (label: string): boolean =>
  loopLines(label).every((line) => monoWidth(line, LOOP_FONT.fontSize, LOOP_FONT.letterSpacingEm) <= LOOP_LINE_WIDTH)
