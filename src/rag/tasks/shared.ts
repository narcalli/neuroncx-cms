import type { TaskConfig } from 'payload'

type RetryConfig = Exclude<NonNullable<TaskConfig<any>['retries']>, number>

/** NCX can be briefly unreachable, and a new section takes a minute to index. */
export const ragRetries: RetryConfig = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 60_000 },
}
