import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import type { RagSection } from '../types'

const DIR = path.resolve(process.cwd(), 'rag-debug')
const LOG = path.join(DIR, 'log.ndjson')
const STATE = path.join(DIR, 'state.json')

export const ENABLED = process.env.RAG_DEBUG_SHEET === 'true'

type SectionState = { heading: string; body: string; hash: string }
type State = Record<string, { title: string; sections: SectionState[]; syncedAt: string }>

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12)
const key = (collection: string, id: string) => `${collection}:${id}`

const readState = async (): Promise<State> => {
  try {
    return JSON.parse(await fs.readFile(STATE, 'utf8'))
  } catch {
    return {}
  }
}

const writeState = async (state: State) => {
  await fs.mkdir(DIR, { recursive: true })
  await fs.writeFile(STATE, JSON.stringify(state, null, 2), 'utf8')
}

const preview = (raw: unknown, max = 600): string => {
  if (raw == null) return ''
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw)
  return s.length > max ? `${s.slice(0, max)} …[${s.length} chars]` : s
}

export const recordSync = async (args: {
  collection: string
  id: string
  title: string
  url: string
  sections: RagSection[]
}) => {
  if (!ENABLED) return

  const { collection, id, title, url, sections } = args
  const state = await readState()
  const k = key(collection, id)
  const prev = state[k]?.sections ?? []
  const runAt = new Date().toISOString()

  const rows: any[] = []
  const seen = new Set<number>()

  sections.forEach((s, i) => {
    const h = hash(s.body)
    // match on heading first, fall back to position
    let pi = prev.findIndex((p, j) => p.heading === s.heading && !seen.has(j))
    if (pi === -1 && prev[i] && !seen.has(i)) pi = i
    if (pi !== -1) seen.add(pi)
    const before = pi === -1 ? undefined : prev[pi]

    rows.push({
      runAt,
      collection,
      docId: id,
      title,
      url,
      index: i,
      heading: s.heading,
      anchor: s.anchor ?? '',
      source: preview(s.raw),
      sourceType: (s.raw as any)?.blockType ?? (s.raw as any)?.root ? 'richText' : typeof s.raw,
      newText: s.body,
      oldText: before?.body ?? '',
      status: !before ? 'new' : before.hash === h ? 'unchanged' : 'changed',
      chars: s.body.length,
      charsDelta: s.body.length - (before?.body.length ?? 0),
    })
  })

  // sections that existed last run and are gone now
  prev.forEach((p, j) => {
    if (seen.has(j)) return
    rows.push({
      runAt, collection, docId: id, title, url,
      index: j, heading: p.heading, anchor: '', source: '', sourceType: '',
      newText: '', oldText: p.body, status: 'removed',
      chars: 0, charsDelta: -p.body.length,
    })
  })

  await fs.mkdir(DIR, { recursive: true })
  await fs.appendFile(LOG, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8')

  state[k] = {
    title,
    syncedAt: runAt,
    sections: sections.map((s) => ({ heading: s.heading, body: s.body, hash: hash(s.body) })),
  }
  await writeState(state)
}

export const recordPurge = async (args: { collection: string; id: string }) => {
  if (!ENABLED) return
  const { collection, id } = args
  const state = await readState()
  const k = key(collection, id)
  const prev = state[k]
  if (!prev) return

  const runAt = new Date().toISOString()
  const rows = prev.sections.map((p, j) => ({
    runAt, collection, docId: id, title: prev.title, url: '',
    index: j, heading: p.heading, anchor: '', source: '', sourceType: '',
    newText: '', oldText: p.body, status: 'purged',
    chars: 0, charsDelta: -p.body.length,
  }))

  await fs.mkdir(DIR, { recursive: true })
  await fs.appendFile(LOG, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8')

  delete state[k]
  await writeState(state)
}
