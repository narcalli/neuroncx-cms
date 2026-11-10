import type { ArrayFieldValidation, CollectionConfig } from 'payload'
import { array } from 'payload/shared'

import { adminOnly } from '../../access/adminOnly'
import { authenticated } from '../../access/authenticated'
import { lifecycleOptions } from '../../lifecycle/scope'
import {
  keepItemIdsRetired,
  noteSupersededRubric,
  numberRubricVersion,
  retireSupersededRubrics,
} from './hooks'

/** No two items share an ID, so every benchmark result points at one item. */
export const validateItems: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  if (!Array.isArray(value)) return true
  const ids = (value as { itemId?: string | null }[]).map((r) => r?.itemId?.trim()).filter(Boolean)
  const twice = ids.find((id, i) => ids.indexOf(id) !== i)
  return twice ? `Each item needs its own ID, and ${twice} is used more than once.` : true
}

/**
 * The criteria content is scored against before it can be published. Drafts
 * with History (applyHistory) like the content collections. One rubric is
 * Active at a time. Benchmark runs (src/collections/BenchmarkRuns) record
 * each scoring against it.
 */
export const Rubrics: CollectionConfig = {
  slug: 'rubrics',
  labels: { singular: 'Rubric', plural: 'Rubrics' },
  access: {
    read: authenticated,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  admin: {
    group: 'System',
    useAsTitle: 'name',
    defaultColumns: ['name', 'version', 'status', 'updatedAt'],
    description:
      'The criteria content is scored against before it can be published. One rubric is Active at a time; publishing another as Active retires it.',
  },
  hooks: {
    beforeChange: [numberRubricVersion, noteSupersededRubric, keepItemIdsRetired],
    afterChange: [retireSupersededRubrics],
  },
  versions: {
    drafts: { autosave: false },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'What the rubric is called in lists and on benchmark runs.',
      },
    },
    {
      name: 'version',
      type: 'number',
      access: { create: () => false, update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Goes up by one when a publish changes the items. Renaming or retiring keeps the number. A draft shows the version last published.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Retired', value: 'retired' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Active: the rubric content is scored against. Publishing a rubric as Active retires the one that was Active. Retired: no longer used, kept for the runs that used it. A rubric still being written stays a draft until it is published.',
      },
    },
    {
      name: 'supersedes',
      type: 'relationship',
      relationTo: 'rubrics',
      access: { create: () => false, update: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The rubric that was Active until this one was published as Active. Set automatically.',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Item', plural: 'Items' },
      validate: validateItems,
      admin: {
        description: 'One row per criterion. Each benchmark run records a result for each item.',
      },
      fields: [
        {
          name: 'itemId',
          type: 'text',
          label: 'Item ID',
          required: true,
          admin: {
            description:
              'A short code that stays with this criterion for good, for example EX-01. Runs refer to it, so it is never changed or given to another criterion.',
          },
        },
        {
          name: 'dimension',
          type: 'select',
          required: true,
          options: [
            { label: 'Extractability', value: 'extractability' },
            { label: 'Engagement', value: 'engagement' },
          ],
          admin: {
            description:
              'Extractability: whether a bot or search engine can lift the facts out correctly. Engagement: whether a reader is drawn in and acts.',
          },
        },
        {
          name: 'criterion',
          type: 'textarea',
          required: true,
          admin: {
            description: 'What is checked, in one or two sentences.',
          },
        },
        {
          name: 'passCondition',
          type: 'textarea',
          label: 'Pass condition',
          required: true,
          admin: {
            description: 'What the content must show to pass this item.',
          },
        },
        {
          name: 'severityIfFailed',
          type: 'select',
          label: 'Severity if failed',
          required: true,
          options: [
            { label: 'Blocker', value: 'blocker' },
            { label: 'Warning', value: 'warning' },
          ],
          admin: {
            description:
              'Blocker: a failure stops publishing whatever the score. Warning: a failure lowers the score only.',
          },
        },
        {
          name: 'appliesTo',
          type: 'select',
          label: 'Applies to',
          hasMany: true,
          required: true,
          options: lifecycleOptions(),
          admin: {
            description: 'The content types this item is scored on. Elsewhere it is recorded as not applicable.',
          },
        },
      ],
    },
  ],
}
