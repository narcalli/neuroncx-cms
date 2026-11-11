import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { hidePendingFieldRowsFromVisitors, withoutPendingRows } from '@/content/pending'

/**
 * Pending rows inside blocks (src/content/pending.ts): a stat nested in a
 * page's layout never reaches visitors, wherever the block is used.
 */

const page = {
  title: 'CRM for agentic workflows',
  layout: [
    {
      blockType: 'agenticStats',
      heading: 'Stats',
      stats: [
        { value: 80, suffix: '%', label: 'handled without an agent', pending: true },
        { value: 3, suffix: 'x', label: 'faster replies' },
      ],
    },
    { blockType: 'agenticStats', stats: [{ value: 12, label: 'calls checked', pending: true }] },
  ],
}

type FieldHookArgs = Parameters<typeof hidePendingFieldRowsFromVisitors>[0]
const readAs = (req: Partial<PayloadRequest>, value: unknown) =>
  hidePendingFieldRowsFromVisitors({ value, req } as unknown as FieldHookArgs)

describe('pending rows inside blocks', () => {
  it('are left out at any depth, leaving everything else as it was', () => {
    expect(withoutPendingRows(page)).toEqual({
      title: 'CRM for agentic workflows',
      layout: [
        { blockType: 'agenticStats', heading: 'Stats', stats: [{ value: 3, suffix: 'x', label: 'faster replies' }] },
        { blockType: 'agenticStats', stats: [] },
      ],
    })
    // The original is not changed.
    expect(page.layout[0].stats).toHaveLength(2)
  })

  it('are hidden from anonymous API readers by the stats field, and kept for signed-in readers and server code', () => {
    const stats = page.layout[0].stats
    expect(readAs({ payloadAPI: 'REST' }, stats)).toEqual([stats[1]])
    expect(readAs({ payloadAPI: 'GraphQL' }, stats)).toEqual([stats[1]])
    expect(readAs({ payloadAPI: 'REST', user: { id: 'u1' } as PayloadRequest['user'] }, stats)).toEqual(stats)
    expect(readAs({ payloadAPI: 'local' }, stats)).toEqual(stats)
  })

  it('is on the stats field of the Agentic Stats block, so it applies in every collection that uses it', async () => {
    const block = (await config).blocks?.find((b) => b.slug === 'agenticStats')
    const stats = block?.fields.find((f) => 'name' in f && f.name === 'stats')
    expect(stats && 'hooks' in stats ? stats.hooks?.afterRead : undefined).toContain(hidePendingFieldRowsFromVisitors)
  })
})
