// src/rag/tasks/sync-doc.ts
import type { TaskConfig } from 'payload'

export const ragSyncDocTask: TaskConfig<any> = {
  slug: 'ragSyncDoc',
  retries: 3,
  inputSchema: [
    { name: 'collection', type: 'text', required: true },
    { name: 'id', type: 'text', required: true },
    { name: 'locale', type: 'text' },
  ],
  outputSchema: [
    { name: 'chunksEmbedded', type: 'number' },
    { name: 'chunksDeleted', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const { syncDoc } = await import('../sync')
    return { output: await syncDoc(req.payload, input as any) }
  },
}
