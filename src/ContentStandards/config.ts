import type { ArrayFieldValidation, GlobalConfig } from 'payload'
import { array } from 'payload/shared'

import { adminOnly } from '../access/adminOnly'
import { authenticated } from '../access/authenticated'
import { lifecycleOptions } from '../lifecycle/scope'

/** One row per collection, so a collection's gate is never ambiguous. */
export const validateGates: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  if (!Array.isArray(value)) return true
  const seen = (value as { collection?: string | null }[]).map((r) => r?.collection).filter(Boolean)
  const twice = seen.find((c, i) => seen.indexOf(c) !== i)
  return twice ? `Each collection can have one row only, and ${twice} has more than one.` : true
}

/**
 * The benchmark score content must reach before it can be published, by
 * collection (src/lifecycle/gate.ts reads it). Changes take effect without a
 * deploy. Never saved, it reads as the defaults below.
 */
export const ContentStandards: GlobalConfig = {
  slug: 'contentStandards',
  label: 'Content standards',
  access: {
    read: authenticated,
    update: adminOnly,
  },
  admin: {
    group: 'System',
    description: 'The benchmark score content needs before it can be published.',
  },
  fields: [
    {
      name: 'defaultGate',
      type: 'number',
      label: 'Default gate (score out of 100)',
      required: true,
      defaultValue: 85,
      min: 0,
      max: 100,
      admin: {
        description: 'The score needed by any collection without its own row below.',
      },
    },
    {
      name: 'gates',
      type: 'array',
      label: 'Gates by collection',
      labels: { singular: 'Gate', plural: 'Gates' },
      // Higher than the default: these sync to the NCX knowledge base, where an
      // extractability failure becomes a wrong bot answer.
      defaultValue: [
        { collection: 'sectors', gate: 90 },
        { collection: 'industryTopics', gate: 90 },
        { collection: 'microApps', gate: 90 },
      ],
      validate: validateGates,
      admin: {
        description:
          'Starting values, to be recalibrated after the first quarter of real benchmark runs. A collection without a row uses the default gate.',
      },
      fields: [
        {
          name: 'collection',
          type: 'select',
          required: true,
          options: lifecycleOptions(),
          admin: {
            description: 'The collection this gate applies to.',
          },
        },
        {
          name: 'gate',
          type: 'number',
          label: 'Gate (score out of 100)',
          required: true,
          min: 0,
          max: 100,
          admin: {
            description: 'The score this collection must reach.',
          },
        },
      ],
    },
  ],
}
