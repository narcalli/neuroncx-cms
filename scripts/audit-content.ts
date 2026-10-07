// Reports blocks whose content is empty where content is expected: an array
// with no items, or a required top-level text field left blank. Reads Payload's
// own loaded config rather than parsing files, so nested fields inside array
// items are not mistaken for missing block-level content.
//
//   NODE_OPTIONS="--import=tsx/esm" node --env-file=.env scripts/audit-content.ts
import fs from 'node:fs'

import config from '@payload-config'
import { getPayload } from 'payload'

type Expect = { arrays: string[]; required: string[] }

const collect = (fields: any[], into: Expect) => {
  for (const f of fields) {
    if (f.type === 'array' && f.name) into.arrays.push(f.name)
    else if (['text', 'textarea', 'richText'].includes(f.type) && f.name && f.required) into.required.push(f.name)
    // rows, groups and collapsibles hold block-level fields too
    else if (['row', 'collapsible'].includes(f.type) && Array.isArray(f.fields)) collect(f.fields, into)
  }
}

const run = async () => {
  const payload = await getPayload({ config })
  const pages = payload.config.collections.find((c: any) => c.slug === 'pages')
  const layout = JSON.parse(JSON.stringify(pages)).fields
  const findBlocks = (fields: any[]): any[] => {
    for (const f of fields) {
      if (f.type === 'blocks' && f.name === 'layout') return f.blocks
      if (Array.isArray(f.fields)) { const r = findBlocks(f.fields); if (r.length) return r }
      if (Array.isArray(f.tabs)) for (const t of f.tabs) { const r = findBlocks(t.fields || []); if (r.length) return r }
    }
    return []
  }
  const expects: Record<string, Expect> = {}
  for (const b of findBlocks(layout)) {
    const e: Expect = { arrays: [], required: [] }
    collect(b.fields || [], e)
    expects[b.slug] = e
  }

  const docs = (await payload.find({ collection: 'pages', limit: 500, depth: 0 })).docs as any[]
  const rows: string[][] = []
  for (const page of docs) {
    for (const [i, block] of (page.layout || []).entries()) {
      const e = expects[block.blockType]
      if (!e) continue
      const emptyArrays = e.arrays.filter((f) => !Array.isArray(block[f]) || block[f].length === 0)
      const missingText = e.required.filter((f) => !block[f] || String(block[f]).trim() === '')
      if (!emptyArrays.length && !missingText.length) continue
      rows.push([
        page.slug || String(page.id),
        `#${i + 1} ${block.blockType}`,
        [...emptyArrays.map((f) => `${f}: no items`), ...missingText.map((f) => `${f}: blank`)].join('; '),
        page._status || 'published',
      ])
    }
  }

  const w = [0, 1, 2, 3].map((c) => Math.max(...rows.map((r) => r[c].length), 6))
  const line = (r: string[]) => r.map((v, c) => v.padEnd(w[c])).join('  ')
  fs.writeSync(1, [
    line(['PAGE', 'BLOCK', 'MISSING', 'STATUS']),
    line(w.map((n) => '-'.repeat(n))),
    ...rows.map(line),
    '',
    `${rows.length} block(s) with empty content across ${new Set(rows.map((r) => r[0])).size} page(s).`,
  ].join('\n') + '\n')
  process.exit(0)
}

void run()
