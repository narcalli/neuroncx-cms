import type { CollectionConfig } from 'payload'

/**
 * Access for Payload's jobs collection (payload-jobs), which has none of its
 * own, so by default anyone signed in, API keys included, could create, edit
 * and delete jobs through the API. A scheduled-publish job created that way
 * with no user runs with full access and publishes: it went round the API-key
 * draft-only rule, the review workflow and the benchmark gate's roles.
 *
 * Through the API (REST, GraphQL, or the Local API with overrideAccess:
 * false) jobs can now only be read, by someone signed in: the admin's
 * schedule drawer lists upcoming schedules that way. Payload's own job
 * system (scheduling, the knowledge base sync, running jobs, cancelling a
 * schedule) writes through the Local API with access overridden, so it is
 * unaffected.
 */
export const withJobsAccess = (jobs: CollectionConfig): CollectionConfig => ({
  ...jobs,
  access: {
    ...jobs.access,
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
})
