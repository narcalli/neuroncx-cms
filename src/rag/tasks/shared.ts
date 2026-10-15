import type { TaskConfig } from 'payload'

type RetryConfig = Exclude<NonNullable<TaskConfig<any>['retries']>, number>

/** NCX can be briefly unreachable, and a new section takes a minute to index. */
export const ragRetries: RetryConfig = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 60_000 },
}

/**
 * One job per document at a time, and only the latest pending one runs: a
 * sync and a purge of the same document never overlap, and five quick
 * republishes cost one sync.
 */
export const ragConcurrency = {
  key: ({ input }: { input: any }) => `ncx:${input?.collection}:${input?.id}`,
  exclusive: true,
  supersedes: true,
}
