import { revalidatePath, revalidateTag } from 'next/cache'

export const FRONTEND_CACHE_TAG = 'frontend'

type RevalidateFrontendArgs = {
  logger?: {
    info?: (message: string) => void
  }
  reason: string
}

export const revalidateFrontend = ({ logger, reason }: RevalidateFrontendArgs) => {
  logger?.info?.(`Revalidating frontend: ${reason}`)

  revalidatePath('/', 'layout')
  revalidateTag(FRONTEND_CACHE_TAG, 'max')
}
