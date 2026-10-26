/**
 * The industries an agent is used in (microApps, Verticals) and the ones an
 * Agentic Flow Demo can show agents for. One list, so the two always match.
 */
export const VERTICAL_OPTIONS = [
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Diagnostics', value: 'diagnostics' },
  { label: 'Education', value: 'education' },
  { label: 'Hospitality', value: 'hospitality' },
] as const

export type Vertical = (typeof VERTICAL_OPTIONS)[number]['value']
