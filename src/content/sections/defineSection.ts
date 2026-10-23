import type { Block, Field } from 'payload'

import { withPresentation } from '../../fields/presentation'
import { plainText } from '../../fields/validators/plainText'

/**
 * Page sections for content collections (docs/cms/foundation.md section 5).
 * A section is a Payload block that draws from the entry's own fields, plus
 * a website component. Collections list the sections editors may add to an
 * entry's layout field (src/fields/layout.ts).
 *
 * Block slugs are the key plus "Section" (faqSection), so a section never
 * shares a slug with a page block such as faq or benefits.
 */

export type SectionDefinition = {
  /** Registry key, such as agentPanel. */
  key: string
  /** Admin label in the block picker. */
  label: string
  /** The entry fields the section draws from. */
  reads: string[]
  /** Entry fields that must be filled to publish while the section is in the layout. */
  requiredWhenOn: string[]
  /**
   * Heading used when neither the block nor the collection sets one. {name}
   * is the entry's name; {family} (any grouping field name) is its grouping.
   */
  headingDefault: string
  /**
   * Section-only settings. A heading override is always added first. A
   * function is called when the blocks are built, after every collection is
   * registered, for fields that point at registered collections.
   */
  fields?: Field[] | (() => Field[])
  /** The one section that may use Highlight (navy). */
  navyAllowed?: boolean
}

const sections = new Map<string, SectionDefinition>()

const pascal = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

/** The block slug for a section key: agentPanel becomes agentPanelSection. */
export const sectionBlockSlug = (key: string): string => `${key}Section`

/** Adds a section to the registry. Defining one again replaces it (hot reload). */
export const defineSection = (def: SectionDefinition): SectionDefinition => {
  sections.set(def.key, def)
  return def
}

export const getSection = (key: string): SectionDefinition | undefined => sections.get(key)

/** The section a layout block belongs to, from its blockType. */
export const sectionForBlockType = (blockType: unknown): SectionDefinition | undefined =>
  typeof blockType === 'string' && blockType.endsWith('Section')
    ? sections.get(blockType.slice(0, -'Section'.length))
    : undefined

export const allSections = (): SectionDefinition[] => [...sections.values()]

/** Fills {name} and grouping tokens such as {family} in a heading template. */
export const fillHeading = (template: string, values: Record<string, string | undefined>): string =>
  template.replace(/\{(\w+)\}/g, (token, key: string) => values[key] ?? token)

/**
 * The Payload block for a section. `collectionHeadings` lists the default
 * headings collections set for it, so the admin shows the one that applies.
 */
export const buildSectionBlock = (
  def: SectionDefinition,
  collectionHeadings: { label: string; heading: string }[] = [],
): Block => {
  const defaults = [
    `"${def.headingDefault}"`,
    ...collectionHeadings.map((c) => `"${c.heading}" for ${c.label}`),
  ].join(', ')
  return withPresentation({
    slug: sectionBlockSlug(def.key),
    interfaceName: `${pascal(def.key)}Section`,
    labels: { singular: def.label, plural: def.label },
    admin: {
      group: 'From this entry',
      components: {
        Label: {
          path: '@/fields/LayoutField/RowLabel#LayoutRowLabel',
          clientProps: { label: def.label, headingDefault: def.headingDefault },
        },
      },
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        label: 'Heading (optional)',
        maxLength: 70,
        validate: plainText,
        admin: {
          description: `Leave empty to show the default heading: ${defaults}. Words in braces, such as {name}, are filled in for each entry.`,
        },
      },
      ...(typeof def.fields === 'function' ? def.fields() : (def.fields ?? [])),
    ],
  })
}
