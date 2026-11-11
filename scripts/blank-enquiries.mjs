/**
 * Enquiries hold personal data (names, emails, phone numbers, messages) from
 * healthcare clients' leads. Copies of the database on a developer's machine
 * keep the enquiries but not the people: each gets placeholder details.
 *
 *   node scripts/blank-enquiries.mjs           the dev database (DATABASE_URL in .env, on this machine)
 *   node scripts/blank-enquiries.mjs --test    the tests' database (scripts/test-db.mjs)
 *
 * scripts/test-db.mjs blanks them as it copies. Only ever runs against a
 * database on this machine.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

/** One enquiry, with placeholders for everything that identifies the person. */
export const blankEnquiry = (doc, n) => ({
  ...doc,
  name: `Enquiry ${n}`,
  email: `enquiry-${n}@example.invalid`,
  company: null,
  mobile: null,
  message: null,
  ...(doc.ncxLead ? { ncxLead: { ...doc.ncxLead, note: null } } : {}),
})

/** One entry of the enquiry read log, without where it came from. */
export const blankEnquiryRead = (doc) => ({ ...doc, ip: null, userAgent: null })

/** Blanks every enquiry and read log entry in one database. */
export const blankEnquiriesIn = async (db) => {
  const enquiries = db.collection('enquiries')
  let n = 0
  for await (const doc of enquiries.find({}, { sort: { _id: 1 } })) {
    n++
    await enquiries.replaceOne({ _id: doc._id }, blankEnquiry(doc, n))
  }
  const reads = await db.collection('enquiryreads').updateMany({}, { $set: { ip: null, userAgent: null } })
  return { enquiries: n, reads: reads.modifiedCount }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(root, 'scripts', 'blank-enquiries.mjs')) {
  const test = process.argv.includes('--test')
  const url = test
    ? 'mongodb://127.0.0.1:27018/neuroncx?replicaSet=rs0'
    : (fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')) ?? '').slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '')
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
    fs.writeSync(2, 'Refusing: that database is not on this machine.\n')
    process.exit(1)
  }
  const client = new MongoClient(url)
  await client.connect()
  try {
    const { enquiries, reads } = await blankEnquiriesIn(client.db())
    fs.writeSync(1, `${test ? 'Test' : 'Dev'} database: ${enquiries} enquiries blanked, ${reads} read log entries cleared.\n`)
  } finally {
    await client.close()
  }
}
