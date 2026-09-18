import type { GlobalAfterChangeHook } from 'payload'

import { revalidateFrontend } from '@/hooks/revalidateFrontend'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    revalidateFrontend({
      logger: payload.logger,
      reason: 'footer changed',
    })
  }

  return doc
}
