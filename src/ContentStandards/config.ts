import type { ArrayFieldValidation, GlobalConfig } from 'payload'
import { array } from 'payload/shared'

import { adminInPerson } from '../access/adminInPerson'
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

// Starting lists, for the content owner to extend. Terms are written as they
// appear in content ("Family", not "Agent family"); their meanings are left for
// the module owner.
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
const TERMS = ['Bot swarm', 'Family', 'Episode', 'Cart', 'Context Engine']
// The people who use NeuronCx and their business types, never their customers.
const AUDIENCES = [
  'front desk',
  'receptionist',
  'admissions office',
  'admissions team',
  'admissions counsellor',
  'counsellor',
  'supervisor',
  'manager',
  'team lead',
  'call centre',
  'contact centre',
  'operations team',
  'IT team',
  'hospital',
  'clinic',
  'diagnostic chain',
  'diagnostics lab',
  'university',
  'college',
  'school',
  'salon',
]
const CHANNELS = ['WhatsApp', 'chat', 'call', 'phone', 'SMS', 'email', 'voice', 'web form']

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
    // An admin in person, never a key: it holds the review switch and the
    // gates, so a key that could change it could switch the review off and publish.
    update: adminInPerson,
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
      // Set just below the best calibration score (80, on 11 Nov 2026), so the
      // gate starts where content is and rises with it. The guideline's target
      // for knowledge base content is 95.
      defaultValue: [
        { collection: 'sectors', gate: 75 },
        { collection: 'industryTopics', gate: 75 },
        { collection: 'microApps', gate: 75 },
      ],
      validate: validateGates,
      admin: {
        description:
          'Starting values from calibration, to be recalibrated after the first quarter of real benchmark runs. Each gate rises in steps of 5 once 80 percent of the published entries in that collection clear the next step. A collection without a row uses the default gate.',
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
      name: 'audienceWords',
      type: 'array',
      label: 'Audience words (roles and business types)',
      labels: { singular: 'Audience word', plural: 'Audience words' },
      // Rubric checks en-audience-named, en-hero-says-what and ex-kb-answer-complete.
      defaultValue: AUDIENCES.map((word) => ({ word })),
      validate: validateUniqueNames('word'),
      admin: {
        description:
          'Words that name who content is for: the people who use NeuronCx and their business types, never their customers or students.',
      },
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
          maxLength: 60,
          admin: { description: 'As it is written in content, for example front desk.' },
        },
      ],
    },
    {
      name: 'channelWords',
      type: 'array',
      label: 'Channel words',
      labels: { singular: 'Channel word', plural: 'Channel words' },
      // Rubric check en-concrete-example.
      defaultValue: CHANNELS.map((word) => ({ word })),
      validate: validateUniqueNames('word'),
      admin: {
        description: 'The ways customers reach a business, as content names them. A concrete example names one.',
      },
      fields: [
        {
          name: 'word',
          type: 'text',
          required: true,
          maxLength: 40,
          admin: { description: 'As it is written in content, for example WhatsApp.' },
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
    {
      name: 'reviewRequired',
      type: 'checkbox',
      label: 'Authors need review to publish',
      defaultValue: false,
      admin: {
        description:
          'On: on Pages, Posts, Industries, Industry topics and Bot swarm, authors cannot publish or schedule a publish. They tick Ready for review, and content owners and admins are emailed. Off: anyone signed in can publish, and no review emails are sent.',
      },
    },
  ],
}
