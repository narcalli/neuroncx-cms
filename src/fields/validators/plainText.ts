import type { Validate } from 'payload'
import {
  array as validateArray,
  text as validateText,
  textarea as validateTextarea,
} from 'payload/shared'

/**
 * Plain text only, for fields read by WhatsApp and the knowledge base, where
 * markdown shows up as stray symbols. Rejects the markdown characters * _ #
 * ` [ ], a > at the start of a line (a quote), and em dashes. A hyphen at
 * the start of a line is allowed: WhatsApp shows it as plain text, which
 * suits short lists.
 *
 * Use as `validate: plainText` on a text, textarea or array field. A custom
 * validate replaces Payload's own, so this runs the built-in check for the
 * field's type first: Required, length and row limits keep working.
 *
 * On an array field, every text value in every row is checked. Empty values
 * pass this check; whether a value is needed is up to the field's required.
 */

// Written as a char code so this file holds no em dash itself.
const EM_DASH = String.fromCharCode(0x2014)

const BLOCKED: { char: string; name: string }[] = [
  { char: '*', name: 'the * character' },
  { char: '_', name: 'the _ character' },
  { char: '#', name: 'the # character' },
  { char: '`', name: 'the ` character' },
  { char: '[', name: 'the [ character' },
  { char: ']', name: 'the ] character' },
  { char: EM_DASH, name: 'the em dash. Use a comma, or split the sentence' },
]

const PLAIN = 'This field is plain text.'

/** The problem with one string, or null when it is plain text. */
export const plainTextProblem = (value: string): string | null => {
  for (const { char, name } of BLOCKED) {
    if (value.includes(char)) return `Remove ${name}. ${PLAIN}`
  }
  if (/^\s*>/m.test(value)) {
    return `Remove the > at the start of the line. ${PLAIN}`
  }
  return null
}

// Every string in a value: a string, a list of strings, or array rows.
const stringsIn = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(stringsIn)
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => key !== 'id')
      .flatMap(([, v]) => stringsIn(v))
  }
  return []
}

/** The plain-text check alone, with no built-in field validation. */
export const checkPlainText = (value: unknown): true | string => {
  const items = Array.isArray(value) ? value : [value]
  for (let i = 0; i < items.length; i++) {
    for (const s of stringsIn(items[i])) {
      const problem = plainTextProblem(s)
      if (problem) return items.length > 1 ? `Item ${i + 1}: ${problem}` : problem
    }
  }
  return true
}

const builtIn: Record<string, Validate> = {
  array: validateArray as Validate,
  text: validateText as Validate,
  textarea: validateTextarea as Validate,
}

export const plainText: Validate = async (value, options) => {
  const type = (options as { type?: string }).type
  const own = type ? builtIn[type] : undefined
  if (own) {
    const result = await own(value, options)
    if (result !== true) return result
  }
  return checkPlainText(value)
}
