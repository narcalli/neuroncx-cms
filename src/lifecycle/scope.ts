/**
 * The collections the content lifecycle covers so far: the three built on
 * defineContentCollection, which sync to the NCX knowledge base. Rubric items,
 * benchmark runs and gates are limited to these. Pages and posts join later.
 * Labels match the admin's navigation.
 */
export const LIFECYCLE_COLLECTIONS = [
  { label: 'Industries', value: 'sectors' },
  { label: 'Industry topics', value: 'industryTopics' },
  { label: 'Bot swarm', value: 'microApps' },
] as const

export type LifecycleCollection = (typeof LIFECYCLE_COLLECTIONS)[number]['value']

export const LIFECYCLE_SLUGS: LifecycleCollection[] = LIFECYCLE_COLLECTIONS.map((c) => c.value)

/** For a select field's options, which must be a mutable array. */
export const lifecycleOptions = () => LIFECYCLE_COLLECTIONS.map((c) => ({ ...c }))
