// Starts the tests' database (a one-node replica set, so saves run in
// transactions) before any test file runs. scripts/test-db.mjs has the details.
import { ensureTestDb } from '../scripts/test-db.mjs'

export default async function setup() {
  await ensureTestDb()
}
