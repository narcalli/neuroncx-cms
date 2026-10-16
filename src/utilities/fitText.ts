/**
 * Text fitting helpers shared by the content collections' hooks: cutting a
 * line to a limit on a whole word, the fallback SEO title, and fitting whole
 * names into a WhatsApp row.
 */

/** Cuts text to max characters on a whole word, or hard if one word is longer. */
export const cutOnWord = (text: string, max: number): string => {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : t.slice(0, max)).replace(/[\s,]+$/, '')
}

/** "<keyword> with NeuronCx | NeuronCx", 60 characters at most. */
export const fallbackMetaTitle = (subject: string): string => {
  const suffix = ' | NeuronCx'
  return `${cutOnWord(`${subject} with NeuronCx`, 60 - suffix.length)}${suffix}`
}

/** Names joined with commas, as many whole names as fit in max characters. */
export const fitNames = (names: string[], max = 70): string => {
  let out = ''
  for (const name of names) {
    const next = out ? `${out}, ${name}` : name
    if (next.length > max) break
    out = next
  }
  return out
}
