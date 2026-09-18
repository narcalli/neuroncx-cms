import type { Payload, PayloadRequest } from 'payload'

type SeedArgs = {
  payload: Payload
  req: PayloadRequest
}

export const seed = async ({ payload }: SeedArgs): Promise<void> => {
  payload.logger.info('Seed endpoint called, but no seed routine is configured.')
}
