import type { Validate } from 'payload'
import { text as validateText, textarea as validateTextarea } from 'payload/shared'

type Doc = Record<string, any>

export const publishing = (data: unknown) => (data as Doc | undefined)?._status === 'published'
export const ownPageOn = (data: unknown) => Boolean((data as Doc | undefined)?.hasOwnPage)
export const isEmptyText = (v: unknown) => typeof v !== 'string' || !v.trim()

/**
 * A text field that must be filled to publish an entry with Own page on.
 * Drafts save without it. Runs the field type's own check first, so length
 * limits keep working.
 */
export const requiredForOwnPage =
  (what: string): Validate =>
  (value, options) => {
    const own = (options as { type?: string }).type === 'textarea' ? validateTextarea : validateText
    const builtIn = own(value as any, options as any)
    if (builtIn !== true) return builtIn
    if (ownPageOn(options.data) && publishing(options.data) && isEmptyText(value)) {
      return `Add ${what} before publishing with Own page on.`
    }
    return true
  }
