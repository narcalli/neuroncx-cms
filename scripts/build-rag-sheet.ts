import ExcelJS from 'exceljs'
import { promises as fs } from 'fs'
import path from 'path'

const DIR = path.resolve(process.cwd(), 'rag-debug')

const COLOURS: Record<string, string> = {
  new: 'FFD8F0D8',
  changed: 'FFFFF2CC',
  unchanged: 'FFFFFFFF',
  removed: 'FFF8D7DA',
  purged: 'FFF8D7DA',
}

const main = async () => {
  const raw = await fs.readFile(path.join(DIR, 'log.ndjson'), 'utf8')
  const rows = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l))

  const wb = new ExcelJS.Workbook()

  // Sheet 1: every section of every run
  const s = wb.addWorksheet('Sections', { views: [{ state: 'frozen', ySplit: 1 }] })
  s.columns = [
    { header: 'Run',        key: 'runAt',      width: 20 },
    { header: 'Collection', key: 'collection', width: 12 },
    { header: 'Doc',        key: 'docId',      width: 26 },
    { header: 'Title',      key: 'title',      width: 28 },
    { header: 'URL',        key: 'url',        width: 24 },
    { header: '#',          key: 'index',      width: 5  },
    { header: 'Heading',    key: 'heading',    width: 26 },
    { header: 'Anchor',     key: 'anchor',     width: 16 },
    { header: 'Status',     key: 'status',     width: 11 },
    { header: 'Chars',      key: 'chars',      width: 8  },
    { header: 'Δ',          key: 'charsDelta', width: 8  },
    { header: 'Source type',key: 'sourceType', width: 16 },
    { header: 'Source (A)', key: 'source',     width: 60 },
    { header: 'New text (A)',key: 'newText',   width: 70 },
    { header: 'Old text (B)',key: 'oldText',   width: 70 },
  ]
  s.getRow(1).font = { bold: true }
  s.autoFilter = { from: 'A1', to: 'O1' }

  for (const r of rows) {
    const row = s.addRow(r)
    row.alignment = { vertical: 'top', wrapText: true }
    const fill = COLOURS[r.status]
    if (fill && fill !== 'FFFFFFFF') {
      row.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
      })
    }
  }

  // Sheet 2: one row per sync, so you can see at a glance what moved
  const byRun = new Map<string, any[]>()
  for (const r of rows) {
    const k = `${r.runAt}|${r.collection}|${r.docId}`
    byRun.set(k, [...(byRun.get(k) ?? []), r])
  }

  const d = wb.addWorksheet('Runs', { views: [{ state: 'frozen', ySplit: 1 }] })
  d.columns = [
    { header: 'Run',        key: 'runAt',      width: 20 },
    { header: 'Collection', key: 'collection', width: 12 },
    { header: 'Doc',        key: 'docId',      width: 26 },
    { header: 'Title',      key: 'title',      width: 32 },
    { header: 'Sections',   key: 'sections',   width: 10 },
    { header: 'New',        key: 'new',        width: 7  },
    { header: 'Changed',    key: 'changed',    width: 9  },
    { header: 'Unchanged',  key: 'unchanged',  width: 11 },
    { header: 'Removed',    key: 'removed',    width: 10 },
    { header: 'Total chars',key: 'chars',      width: 12 },
  ]
  d.getRow(1).font = { bold: true }

  for (const [, group] of byRun) {
    const count = (st: string) => group.filter((g) => g.status === st).length
    d.addRow({
      runAt: group[0].runAt,
      collection: group[0].collection,
      docId: group[0].docId,
      title: group[0].title,
      sections: group.filter((g) => g.status !== 'removed' && g.status !== 'purged').length,
      new: count('new'),
      changed: count('changed'),
      unchanged: count('unchanged'),
      removed: count('removed') + count('purged'),
      chars: group.reduce((a, g) => a + g.chars, 0),
    })
  }

  const out = path.join(DIR, 'extraction.xlsx')
  await wb.xlsx.writeFile(out)
  console.log(`${rows.length} rows across ${byRun.size} runs -> ${out}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
