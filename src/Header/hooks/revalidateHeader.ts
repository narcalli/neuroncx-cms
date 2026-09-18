import type { GlobalAfterChangeHook } from 'payload'

import { revalidateFrontend } from '@/hooks/revalidateFrontend'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    revalidateFrontend({
      logger: payload.logger,
      reason: 'header changed',
    })
  }

  return doc
}
