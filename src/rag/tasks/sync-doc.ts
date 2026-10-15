// src/rag/tasks/sync-doc.ts
import type { TaskConfig } from 'payload'

import { ragConcurrency, ragRetries } from './shared'

export const ragSyncDocTask: TaskConfig<any> = {
  slug: 'ragSyncDoc',
  retries: ragRetries,
  concurrency: ragConcurrency,
  inputSchema: [
    { name: 'collection', type: 'text', required: true },
    { name: 'id', type: 'text', required: true },
    { name: 'locale', type: 'text' },
  ],
  outputSchema: [
    { name: 'sent', type: 'number' },
    { name: 'unchanged', type: 'number' },
    { name: 'archived', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const { syncDoc } = await import('../sync')
    return { output: await syncDoc(req.payload, input as any) }
  },
}
