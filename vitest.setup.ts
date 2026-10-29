// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// The integration tests create, change and delete records, and each change
// can queue a knowledge base sync job. They run against whatever
// DATABASE_URL points at, so refuse anything but a database on this machine.
// A separate test database elsewhere can be allowed on purpose with
// ALLOW_REMOTE_TEST_DB=1. Only the host is checked; the URL is never printed.
const host = (process.env.DATABASE_URL || '').replace(/^[a-z+]+:\/\/([^@/]*@)?([^/?:,]+).*$/i, '$2')
if (process.env.DATABASE_URL && !['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host) && process.env.ALLOW_REMOTE_TEST_DB !== '1') {
  throw new Error('Integration tests only run against a local database: DATABASE_URL does not point at this machine. Set ALLOW_REMOTE_TEST_DB=1 to use a separate test database on purpose.')
}
