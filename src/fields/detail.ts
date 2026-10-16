import type { Field, Tab } from 'payload'

/**
 * Detail group (fields_reference.md, section 3): the full description and
 * who it is for. The SEO fields sit in their own tab (src/fields/seo.ts), as
 * on integrations. `extra` fields follow.
 */
export const detailTab = (opts: {
  description: string
  whoItsFor: string
  extra?: Field[]
}): Tab => ({
  label: 'Detail',
  fields: [
    {
      name: 'description',
      type: 'richText',
      admin: { description: opts.description },
    },
    {
      name: 'whoItsFor',
      type: 'textarea',
      label: "Who it's for",
      maxLength: 300,
      admin: { description: opts.whoItsFor },
    },
    ...(opts.extra || []),
  ],
})
