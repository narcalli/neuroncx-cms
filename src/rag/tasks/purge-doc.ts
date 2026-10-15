// src/rag/tasks/purge-doc.ts
import type { TaskConfig } from 'payload'

import { ragRetries } from './shared'

export const ragPurgeDocTask: TaskConfig<any> = {
  slug: 'ragPurgeDoc',
  retries: ragRetries,
  inputSchema: [
    { name: 'collection', type: 'text', required: true },
    { name: 'id', type: 'text', required: true },
  ],
  outputSchema: [
    { name: 'sent', type: 'number' },
    { name: 'unchanged', type: 'number' },
    { name: 'archived', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const { purgeDoc } = await import('../sync')
    return { output: await purgeDoc(req.payload, input as any) }
  },
}
