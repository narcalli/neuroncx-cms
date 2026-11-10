import type { ContentStandard } from '@/payload-types'

import type { LifecycleCollection } from './scope'

/**
 * The score a collection's content must reach (src/ContentStandards/config.ts):
 * the collection's own row in Gates by collection, else the default gate.
 */
export const gateFor = (
  standards: Pick<ContentStandard, 'defaultGate' | 'gates'>,
  collection: LifecycleCollection,
): number => standards.gates?.find((g) => g.collection === collection)?.gate ?? standards.defaultGate
