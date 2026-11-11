import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, Field, UIField } from 'payload'
import { ValidationError } from 'payload'

import { contentOwnerOrAdmin } from '@/access/contentOwnerOrAdmin'
import { writeContentEvent } from '@/lifecycle/benchmarkGate'
import { contentHash } from '@/lifecycle/contentHash'

/**
 * The sidebar indicator: where the last saved version stands against the
 * benchmark gate (src/lifecycle/BenchmarkStatus.tsx). Stores nothing.
 */
export const benchmarkStatusField = (): UIField => ({
  name: 'benchmarkStatus',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: { Field: '@/lifecycle/BenchmarkStatus#BenchmarkStatus' },
  },
})

/**
 * A content owner's override of the benchmark gate (guideline 6.6): set only
 * by a content owner or admin, with a reason, and tied to the content it was
 * granted for (gateOverrideHash), so editing the content ends it. Logged in
 * History. Built but not applied while the gate only warns.
 */
export const gateOverrideFields = (): Field[] => [
  {
    name: 'gateOverride',
    type: 'checkbox',
    label: 'Override the benchmark gate (content owner)',
    defaultValue: false,
    access: { create: contentOwnerOrAdmin, update: contentOwnerOrAdmin },
    admin: {
      position: 'sidebar',
      description:
        'Lets this exact content publish below its gate. Only a content owner or admin can set it, with a reason. Editing the content afterwards ends it. Not applied while the gate only warns.',
    },
  },
  {
    name: 'gateOverrideReason',
    type: 'textarea',
    label: 'Override reason',
    maxLength: 500,
    access: { create: contentOwnerOrAdmin, update: contentOwnerOrAdmin },
    admin: {
      position: 'sidebar',
      condition: (_data, siblingData) => Boolean(siblingData?.gateOverride),
      description: 'Why this content may publish below its gate. Kept in History.',
    },
  },
  {
    name: 'gateOverrideHash',
    type: 'text',
    access: { create: () => false, update: () => false },
    admin: {
      hidden: true,
      description: 'The content the override was granted for. Set automatically.',
    },
  },
]

type Doc = Record<string, unknown>

/**
 * beforeChange: an override needs a reason, and is tied to the content it is
 * granted for. The tie is renewed only when the override is newly set or its
 * reason changes; editing the content alone does not carry it over.
 */
export const stampGateOverride: CollectionBeforeChangeHook = ({ data, originalDoc, collection }) => {
  const cur: Doc = { ...(originalDoc as Doc | undefined), ...data }
  if (!cur.gateOverride) {
    data.gateOverrideHash = null
    return data
  }
  const reason = typeof cur.gateOverrideReason === 'string' ? cur.gateOverrideReason.trim() : ''
  if (!reason) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ path: 'gateOverrideReason', message: 'Give the reason for overriding the benchmark gate.' }],
    })
  }
  const newlySet = !originalDoc?.gateOverride || ('gateOverrideReason' in data && data.gateOverrideReason !== originalDoc?.gateOverrideReason)
  data.gateOverrideHash = newlySet ? contentHash(cur) : (originalDoc?.gateOverrideHash ?? null)
  return data
}

/** afterChange: an override set, changed or cleared goes into History. */
export const logGateOverride: CollectionAfterChangeHook = async ({ collection, doc, previousDoc, req }) => {
  const was = Boolean(previousDoc?.gateOverride)
  const now = Boolean(doc.gateOverride)
  const reasonChanged = now && was && doc.gateOverrideReason !== previousDoc?.gateOverrideReason
  if (was === now && !reasonChanged) return doc
  try {
    await writeContentEvent(
      req,
      collection.slug,
      String(doc.id),
      now ? 'overrideSet' : 'overrideCleared',
      now ? `Override of the benchmark gate: ${String(doc.gateOverrideReason ?? '')}` : 'Override of the benchmark gate cleared.',
    )
  } catch (err) {
    req.payload.logger.warn(`Could not record the gate override for ${collection.slug} ${doc.id}: ${String(err)}`)
  }
  return doc
}
