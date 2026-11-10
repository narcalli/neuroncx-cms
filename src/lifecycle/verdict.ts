import type { BenchmarkRun } from '@/payload-types'

export type Verdict = 'pass' | 'fail'

/**
 * Pass or fail for a benchmark run against a gate (src/lifecycle/gate.ts),
 * worked out when it is read, never stored. Fail when any result is a
 * blocker, whatever the score; otherwise pass when the score reaches the
 * gate (a score equal to the gate passes). A run with no score (no item
 * applied) fails: nothing shows the content meets the gate.
 */
export const verdictFor = (run: Pick<BenchmarkRun, 'score' | 'blockerCount'>, gate: number): Verdict => {
  if ((run.blockerCount ?? 0) > 0) return 'fail'
  if (typeof run.score !== 'number') return 'fail'
  return run.score >= gate ? 'pass' : 'fail'
}
