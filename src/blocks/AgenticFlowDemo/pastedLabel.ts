/**
 * Text that ends with a pasted field label, such as "...in the same chat.
 * handlers: agent", copied along with the value from somewhere else. Returns
 * the warning to show, or null. A warning only: the save is not refused.
 */
export const pastedLabelProblem = (value: unknown): string | null =>
  typeof value === 'string' && /\bhandlers:\s*\S+\s*$/i.test(value)
    ? 'This ends with "handlers:" and a word, which looks like a pasted field label. Remove it unless it is meant to show.'
    : null
