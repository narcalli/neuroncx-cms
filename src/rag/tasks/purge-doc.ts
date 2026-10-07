// src/rag/tasks/purge-doc.ts
import type { TaskConfig } from 'payload'

export const ragPurgeDocTask: TaskConfig<any> = {
  slug: 'ragPurgeDoc',
  retries: 3,
  inputSchema: [
    { name: 'collection', type: 'text', required: true },
    { name: 'id', type: 'text', required: true },
  ],
  outputSchema: [{ name: 'chunksDeleted', type: 'number' }],
  handler: async ({ input, req }) => {
    const { purgeDoc } = await import('../sync')
    return { output: await purgeDoc(req.payload, input as any) }
  },
}
