import crypto from 'node:crypto'
import { couchRequest } from './couchdb.js'
import { runDeno } from './deno.js'
import { HttpError, normalizeVaultSlug, parseSetupOutput, vaultIdentifiers } from './lib.js'

const provisionUrl = 'https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/couchdb/provision.ts'
const setupUrl = 'https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/setup/generate_setup_uri.ts'

export async function createVault(input) {
  const slug = normalizeVaultSlug(input)
  const { database, username } = vaultIdentifiers(slug)
  const databases = await couchRequest('/_all_dbs')
  if (databases.includes(database)) throw new HttpError(409, 'Такой vault уже существует', 'VAULT_EXISTS')

  const password = crypto.randomBytes(32).toString('hex')
  const encryptionPassphrase = crypto.randomBytes(32).toString('hex')
  const setupOutput = await runDeno(setupUrl, {
    LIVESYNC_HOST: 'https://notes.selickiy.space',
    LIVESYNC_DB: database,
    LIVESYNC_USER: username,
    LIVESYNC_PASS: password,
    LIVESYNC_PASSPHRASE: encryptionPassphrase,
  })
  const accessKit = parseSetupOutput(setupOutput)

  let databaseCreated = false
  let userCreated = false
  try {
    await runDeno(provisionUrl, {
      hostname: 'http://couchdb:5984',
      username: process.env.COUCHDB_ADMIN_USER,
      password: process.env.COUCHDB_ADMIN_PASSWORD,
      database,
    })
    databaseCreated = true
    await couchRequest(`/_users/org.couchdb.user:${encodeURIComponent(username)}`, {
      method: 'PUT',
      body: { _id: `org.couchdb.user:${username}`, name: username, roles: [], type: 'user', password },
    })
    userCreated = true
    await couchRequest(`/${database}/_security`, {
      method: 'PUT',
      body: { admins: { names: [], roles: ['_admin'] }, members: { names: [username], roles: [] } },
    })
  } catch (error) {
    if (userCreated) {
      try {
        const user = await couchRequest(`/_users/org.couchdb.user:${encodeURIComponent(username)}`)
        await couchRequest(`/_users/org.couchdb.user:${encodeURIComponent(username)}?rev=${encodeURIComponent(user._rev)}`, { method: 'DELETE' })
      } catch { /* best-effort cleanup of a new vault */ }
    }
    if (databaseCreated) await couchRequest(`/${database}`, { method: 'DELETE' }).catch(() => {})
    throw error
  }

  return {
    name: slug,
    database,
    username,
    password,
    encryptionPassphrase,
    ...accessKit,
  }
}
