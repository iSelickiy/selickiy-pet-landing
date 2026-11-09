const token = process.env.CONTROL_PLANE_TOKEN
const adminUser = process.env.COUCHDB_ADMIN_USER
const adminPassword = process.env.COUCHDB_ADMIN_PASSWORD
const database = 'obsidian-qa-probe'
const username = 'vault-qa-probe'
const auth = `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString('base64')}`
let created = false

async function api(path, options = {}) {
  const response = await fetch(`http://127.0.0.1:3100${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status}`)
  return response.json()
}

async function cleanup() {
  const headers = { Authorization: auth }
  await fetch(`http://couchdb:5984/${database}`, { method: 'DELETE', headers })
  const userResponse = await fetch(`http://couchdb:5984/_users/org.couchdb.user:${username}`, { headers })
  if (userResponse.ok) {
    const user = await userResponse.json()
    await fetch(`http://couchdb:5984/_users/org.couchdb.user:${username}?rev=${encodeURIComponent(user._rev)}`, { method: 'DELETE', headers })
  }
}

try {
  await cleanup()
  const health = await fetch('http://127.0.0.1:3100/health').then((response) => response.json())
  if (health.status !== 'ok') throw new Error('Health failed')
  const server = await api('/v1/server')
  if (!Array.isArray(server.services) || !server.resources?.disk?.total) throw new Error('Server overview failed')
  const { vault } = await api('/v1/vaults', { method: 'POST', body: JSON.stringify({ slug: 'qa-probe' }) })
  created = true
  for (const key of ['setupUri', 'setupPassphrase', 'encryptionPassphrase', 'recoveryCode', 'password']) {
    if (!vault[key]) throw new Error(`Missing ${key}`)
  }
  const { vaults } = await api('/v1/vaults')
  if (!vaults.some((item) => item.database === database)) throw new Error('Created vault was not listed')
  await cleanup()
  created = false
  console.log(JSON.stringify({ health: true, serverServices: server.services.length, vaultCreated: true, accessKitValidated: true, cleanup: true }))
} finally {
  if (created) await cleanup()
}
