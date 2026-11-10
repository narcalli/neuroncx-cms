export type ResultState = 'pass' | 'warning' | 'blocker' | 'na'

export type RunTotals = { score: number | null; blockerCount: number }

/**
 * A benchmark run's numbers from its results. score: passes over the items
 * that apply (every state but na), as a percentage rounded to one decimal.
 * Warnings and blockers both count against it. null when no item applies,
 * since there is nothing to score. blockerCount: results that are blockers.
 */
export const scoreResults = (results: { state?: ResultState | null }[]): RunTotals => {
  const applicable = results.filter((r) => r.state !== 'na')
  const passes = applicable.filter((r) => r.state === 'pass').length
  const blockerCount = results.filter((r) => r.state === 'blocker').length
  const score = applicable.length ? Math.round((passes / applicable.length) * 1000) / 10 : null
  return { score, blockerCount }
}
