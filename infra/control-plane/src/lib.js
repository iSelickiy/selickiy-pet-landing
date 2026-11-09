import crypto from 'node:crypto'

export class HttpError extends Error {
  constructor(status, message, code = 'CONTROL_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

export function normalizeVaultSlug(value) {
  const slug = String(value || '').trim().toLowerCase()
  if (!/^[a-z][a-z0-9](?:[a-z0-9-]{0,27}[a-z0-9])?$/.test(slug)) {
    throw new HttpError(400, 'Slug: 2–30 символов, латиница, цифры и дефис', 'INVALID_VAULT_SLUG')
  }
  return slug
}

export function vaultIdentifiers(slug) {
  return { database: `obsidian-${slug}`, username: `vault-${slug}` }
}

export function parseSetupOutput(output) {
  const lines = String(output).split(/\r?\n/).map((line) => line.trim())
  const setupUri = lines.find((line) => line.startsWith('obsidian://setuplivesync?settings='))
  const setupPassphrase = lines.find((line) => line.startsWith('Your passphrase for the Setup URI is:'))?.replace('Your passphrase for the Setup URI is:', '').trim()
  const recoveryCode = lines.find((line) => line.startsWith('ID recovery code:'))?.replace('ID recovery code:', '').trim()
  const expiresAt = lines.find((line) => line.startsWith('Ephemeral: usable until'))?.replace('Ephemeral: usable until', '').trim()
  if (!setupUri || !setupPassphrase || !recoveryCode) {
    throw new HttpError(502, 'Не удалось разобрать ответ генератора Setup URI', 'SETUP_URI_PARSE_ERROR')
  }
  return { setupUri, setupPassphrase, recoveryCode, expiresAt: expiresAt || null }
}

export function tokensMatch(received, expected) {
  const left = Buffer.from(String(received || ''))
  const right = Buffer.from(String(expected || ''))
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right)
}

export const containerActions = new Set(['start', 'stop', 'restart'])
export const protectedContainers = new Set([
  'bigvps-control',
  'obsidian-couchdb',
  'selickiy-landing-app-1',
  'selickiy-landing-db-1',
  'selickiy-landing-migrate-1',
  'traefik',
])

export function assertContainerAction(name, action) {
  if (!/^[/a-zA-Z0-9_.-]+$/.test(String(name))) {
    throw new HttpError(400, 'Некорректное имя контейнера', 'INVALID_CONTAINER')
  }
  if (!containerActions.has(action)) {
    throw new HttpError(400, 'Поддерживаются start, stop и restart', 'INVALID_CONTAINER_ACTION')
  }
  if (protectedContainers.has(String(name).replace(/^\//, ''))) {
    throw new HttpError(409, 'Этот контейнер защищён от действий через админку', 'PROTECTED_CONTAINER')
  }
}

export function isVaultDatabase(name) {
  return name === 'obsidiannotes' || /^obsidian-[a-z][a-z0-9-]+$/.test(name)
}
