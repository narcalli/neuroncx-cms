import type { TaskConfig } from 'payload'

export const ragSyncDocTask: TaskConfig<'ragSyncDoc'> = {
  slug: 'ragSyncDoc',
  retries: 3,
  inputSchema: [
    { name: 'collection', type: 'text', required: true },
    { name: 'id',         type: 'text', required: true },
    { name: 'locale',     type: 'text' },
  ],
  outputSchema: [
    { name: 'chunksEmbedded', type: 'number' },
    { name: 'chunksDeleted',  type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const { syncDoc } = await import('../sync')   // redis + embeddings load here, not at config time
    const result = await syncDoc(req.payload, input)
    return { output: result }
  },
}
