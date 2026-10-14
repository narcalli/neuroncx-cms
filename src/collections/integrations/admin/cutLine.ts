/**
 * Cuts a key point line to fit, for "Fill from status flow".
 *
 * 1. If it fits, it is left as it is.
 * 2. Otherwise, if there is a comma or a full stop before the limit, it is
 *    cut there (a comma is dropped, a full stop kept). A break that would
 *    leave less than half the limit is ignored, so a line never shrinks to
 *    a stub like "Booked".
 * 3. Otherwise it is cut on a whole word, and small words left at the end
 *    (a, an, the, and, or, to, of, for, with, in, on, at, by, from) are
 *    trimmed, so the line never ends on "with the".
 */

const SMALL_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'of',
  'for',
  'with',
  'in',
  'on',
  'at',
  'by',
  'from',
])

const trimEnd = (s: string) => s.replace(/[\s,:;]+$/, '')

export const cutLine = (line: string, max: number): string => {
  const s = line.trim()
  if (s.length <= max) return s

  const within = s.slice(0, max)
  const comma = within.lastIndexOf(',')
  const stop = within.lastIndexOf('.')
  const minimum = Math.floor(max / 2)
  if (stop >= minimum && stop >= comma) return trimEnd(within.slice(0, stop + 1))
  if (comma >= minimum) return trimEnd(within.slice(0, comma))

  // On a whole word: the text before the last space that keeps it within max.
  const room = s.slice(0, max + 1)
  const space = room.lastIndexOf(' ')
  const words = (space > 0 ? s.slice(0, space) : s.slice(0, max)).split(' ')
  while (
    words.length > 1 &&
    SMALL_WORDS.has(words[words.length - 1].toLowerCase().replace(/[^a-z]/g, ''))
  ) {
    words.pop()
  }
  return trimEnd(words.join(' '))
}
