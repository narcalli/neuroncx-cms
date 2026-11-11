import type { ArrayFieldValidation, CollectionConfig } from 'payload'
import { array } from 'payload/shared'

import { adminOnly } from '../../access/adminOnly'
import { authenticated } from '../../access/authenticated'
import { LIFECYCLE_SLUGS } from '../../lifecycle/scope'
import { checkRubricItems, checkScoredVersion, refuseRunEdits, scoreRun, stampRunner } from './hooks'

/** One result per rubric item. */
export const validateResults: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  if (!Array.isArray(value)) return true
  const ids = (value as { itemId?: string | null }[]).map((r) => r?.itemId?.trim()).filter(Boolean)
  const twice = ids.find((id, i) => ids.indexOf(id) !== i)
  return twice ? `Each item can have one result only, and ${twice} has more than one.` : true
}

// Worked out in beforeChange; whatever the request sends is dropped.
const computed = { create: () => false, update: () => false }

/**
 * One scoring of one exact version of a document against a rubric. Scoring
 * happens outside Payload and is recorded here; the publish gate only reads
 * these. Immutable: no drafts, no versions, no edits. A run holds results,
 * score and blockerCount only: pass or fail comes from verdictFor
 * (src/lifecycle/verdict.ts) against the gate at the time it is read, so
 * changing a gate never needs old runs rewritten.
 */
export const BenchmarkRuns: CollectionConfig = {
  slug: 'benchmarkRuns',
  labels: { singular: 'Benchmark run', plural: 'Benchmark runs' },
  access: {
    read: authenticated,
    // Signed in, by a person or with an API key (the scorer).
    create: authenticated,
    update: () => false,
    delete: adminOnly,
  },
  admin: {
    group: 'System',
    defaultColumns: ['document', 'score', 'blockerCount', 'runAt'],
    description:
      'Each time a version of an entry is scored against a rubric. Records are never edited; a new score is a new run.',
  },
  defaultSort: '-runAt',
  hooks: {
    beforeChange: [refuseRunEdits, checkScoredVersion, checkRubricItems, scoreRun, stampRunner],
  },
  fields: [
    {
      name: 'document',
      type: 'relationship',
      relationTo: LIFECYCLE_SLUGS,
      required: true,
      index: true,
      admin: {
        description: 'The entry that was scored.',
      },
    },
    {
      name: 'versionId',
      type: 'text',
      label: 'Version ID',
      required: true,
      index: true,
      admin: {
        description:
          'The ID of the exact saved version that was scored. A later edit is a new version and needs its own run.',
      },
    },
    {
      name: 'contentHash',
      type: 'text',
      label: 'Content hash',
      index: true,
      access: computed,
      admin: {
        readOnly: true,
        description:
          'A fingerprint of the scored version\'s content, worked out from that version. The publish gate matches runs to content by it.',
      },
    },
    {
      name: 'rubric',
      type: 'relationship',
      relationTo: 'rubrics',
      required: true,
      admin: {
        description: 'The rubric the version was scored against.',
      },
    },
    {
      name: 'rubricVersion',
      type: 'text',
      label: 'Rubric version',
      required: true,
      admin: {
        description:
          "The rubric's version number when it was scored, kept so later edits to the rubric do not change what this run means. Must be a published version, and every result an item in it.",
      },
    },
    {
      name: 'results',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Result', plural: 'Results' },
      validate: validateResults,
      admin: {
        description: 'One row per rubric item.',
      },
      fields: [
        {
          name: 'itemId',
          type: 'text',
          label: 'Item ID',
          required: true,
          admin: {
            description: "The rubric item's ID, for example EX-01.",
          },
        },
        {
          name: 'state',
          type: 'select',
          required: true,
          options: [
            { label: 'Pass', value: 'pass' },
            { label: 'Warning', value: 'warning' },
            { label: 'Blocker', value: 'blocker' },
            { label: 'Not applicable', value: 'na' },
          ],
          admin: {
            description:
              'Not applicable: the item does not apply to this document, for example an SEO check on an entry with no page of its own. Left out of the score.',
          },
        },
        {
          name: 'note',
          type: 'textarea',
          admin: {
            description: 'Why it passed or failed, for whoever fixes the content.',
          },
        },
        {
          name: 'decidedBy',
          type: 'select',
          label: 'Decided by',
          required: true,
          defaultValue: 'human',
          options: [
            { label: 'Code', value: 'code' },
            { label: 'Person', value: 'human' },
          ],
          admin: {
            description:
              'Code: the same content always gets the same result. Person: scored by hand on a worksheet. Shows which part of the score can be reproduced.',
          },
        },
      ],
    },
    {
      name: 'score',
      type: 'number',
      access: computed,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Passes as a percentage of the items that apply, to one decimal. Worked out from the results; empty when no item applies.',
      },
    },
    {
      name: 'blockerCount',
      type: 'number',
      label: 'Blockers',
      access: computed,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'How many results are blockers. Worked out from the results.',
      },
    },
    {
      name: 'runAt',
      type: 'date',
      label: 'Run at',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When the scoring ran. Defaults to when the run was recorded.',
      },
    },
    {
      name: 'runBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Run by',
      access: computed,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Who recorded the run, or the owner of the API key used. Set automatically.',
      },
    },
  ],
}
