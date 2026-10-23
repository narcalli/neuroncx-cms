import type { TextareaField, TextField } from 'payload'

import { plainText } from './validators/plainText'

const COUNTER = '@/fields/CharCounter/Component#CharCounterDescription'

type CountedOptions = {
  name: string
  label?: string
  maxLength: number
  description?: string
  required?: boolean
}

/**
 * A plain-text field with a live character counter under it. The limit is
 * the hard cap (maxLength); the counter shows how close the text is.
 */
export function countedText(opts: CountedOptions & { textarea: true }): TextareaField
export function countedText(opts: CountedOptions & { textarea?: false }): TextField
export function countedText({
  name,
  label,
  maxLength,
  description,
  required,
  textarea,
}: CountedOptions & { textarea?: boolean }): TextField | TextareaField {
  const admin = { description, components: { Description: COUNTER } }
  return textarea
    ? { name, label, type: 'textarea', maxLength, required, validate: plainText, admin }
    : { name, label, type: 'text', maxLength, required, validate: plainText, admin }
}
