import { HttpError, isVaultDatabase } from './lib.js'

const baseUrl = process.env.COUCHDB_URL || 'http://couchdb:5984'
const adminUser = process.env.COUCHDB_ADMIN_USER
const adminPassword = process.env.COUCHDB_ADMIN_PASSWORD

export async function couchRequest(path, { method = 'GET', body, username = adminUser, password = adminPassword } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) {
    let reason = `CouchDB вернул ${response.status}`
    try {
      const payload = await response.json()
      if (payload?.error) reason = `${reason}: ${payload.error}`
    } catch { /* keep status error */ }
    throw new HttpError(response.status >= 500 ? 502 : response.status, reason, 'COUCHDB_ERROR')
  }
  if (response.status === 204) return null
  return response.json()
}

export async function listVaults() {
  const databases = await couchRequest('/_all_dbs')
  const names = databases.filter(isVaultDatabase).sort()
  return Promise.all(names.map(async (database) => {
    const info = await couchRequest(`/${encodeURIComponent(database)}`)
    return {
      name: database === 'obsidiannotes' ? 'Личные заметки' : database.replace(/^obsidian-/, ''),
      database,
      documents: info.doc_count,
      sizeBytes: info.sizes?.file ?? 0,
      status: 'ready',
    }
  }))
}
