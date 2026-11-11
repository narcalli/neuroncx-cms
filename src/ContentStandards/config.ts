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

/** No name twice in a list, ignoring case. */
export const validateUniqueNames =
  (key: string): ArrayFieldValidation =>
  (value, options) => {
    const base = array(value, options)
    if (base !== true) return base
    if (!Array.isArray(value)) return true
    const names = (value as Record<string, unknown>[])
      .map((r) => (typeof r?.[key] === 'string' ? (r[key] as string).trim().toLowerCase() : ''))
      .filter(Boolean)
    const twice = names.find((n, i) => names.indexOf(n) !== i)
    return twice ? `Each name can appear once, and "${twice}" appears more than once.` : true
  }

// Starting lists, for the content owner to extend. Terms are names already
// used in published content; their meanings are left for the module owner.
const THIRD_PARTIES = [
  'Google',
  'Google Ads',
  'Meta',
  'Facebook',
  'Instagram',
  'WhatsApp',
  'YouTube',
  'LinkedIn',
  'CBSE',
  'ICSE',
  'JEE',
  'NEET',
  'CUET',
  'UIDAI',
  'Aadhaar',
  'DigiLocker',
  'NPCI',
  'UPI',
]
const TERMS = ['Bot swarm', 'Agent family', 'Episode', 'Cart', 'Context Engine']

/**
 * The benchmark score content must reach before it can be published, by
 * collection (src/lifecycle/gate.ts reads it), and the lists rubric checks
 * read: third parties content may name, and NeuronCx terms. Changes take
 * effect without a deploy. Never saved, it reads as the defaults below.
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
    description:
      'The benchmark score content needs before it can be published, and the names the rubric accepts.',
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
    {
      name: 'allowedThirdParties',
      type: 'array',
      label: 'Third parties that may be named',
      labels: { singular: 'Third party', plural: 'Third parties' },
      // Rubric check hr-no-client-names: a name passes only if it is NeuronCx,
      // a published customer, an integration, or on this list.
      defaultValue: THIRD_PARTIES.map((name) => ({ name })),
      validate: validateUniqueNames('name'),
      admin: {
        description:
          'Organisations content may name that are not customers or integrations, such as ad platforms, exam boards and regulators. Any other organisation named in content is a blocker.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          maxLength: 60,
          admin: { description: 'As it is written in content, for example Google Ads.' },
        },
      ],
    },
    {
      name: 'terms',
      type: 'array',
      label: 'NeuronCx terms (glossary)',
      labels: { singular: 'Term', plural: 'Terms' },
      // Rubric checks ex-terms-defined (each is defined on first use) and
      // ex-product-claims-exist (a name here exists, as well as the catalogue).
      defaultValue: TERMS.map((term) => ({ term })),
      validate: validateUniqueNames('term'),
      admin: {
        description:
          'NeuronCx names and concepts that are not entries of their own, such as Bot swarm or episode. Content defines each on first use. A product name in content passes if it is here or a published entry.',
      },
      fields: [
        {
          name: 'term',
          type: 'text',
          required: true,
          maxLength: 60,
          admin: { description: 'The term as it is written in content.' },
        },
        {
          name: 'meaning',
          type: 'textarea',
          maxLength: 240,
          admin: { description: 'What it means, in one sentence. Confirmed by the module owner.' },
        },
      ],
    },
  ],
}
