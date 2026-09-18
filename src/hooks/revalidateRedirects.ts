import type { CollectionAfterChangeHook } from 'payload'

import { revalidateFrontend } from './revalidateFrontend'

export const revalidateRedirects: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    revalidateFrontend({
      logger: payload.logger,
      reason: 'redirects changed',
    })
  }

  return doc
}
