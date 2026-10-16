import type { Validate } from 'payload'
import { text as validateText } from 'payload/shared'

/**
 * Heading labels that may use {name} and no other placeholder. `example`
 * ends the error message, for example: What moves between {name} and NeuronCx.
 */
export const nameTokenRule =
  (example: string): Validate =>
  (value, options) => {
    const builtIn = validateText(value, options as any)
    if (builtIn !== true) return builtIn
    if (typeof value !== 'string') return true
    const rest = value.replace(/\{name\}/g, '')
    const token = rest.match(/\{[^}]*\}?|\}/)
    return token
      ? `Only {name} can be used here. Remove ${token[0]}, for example: ${example}.`
      : true
  }
