import test from 'node:test'
import assert from 'node:assert/strict'
import { assertContainerAction, HttpError, isVaultDatabase, normalizeVaultSlug, parseSetupOutput, tokensMatch, vaultIdentifiers } from '../src/lib.js'

test('vault slugs are strict and deterministic', () => {
  assert.equal(normalizeVaultSlug(' Work-Repo '), 'work-repo')
  assert.deepEqual(vaultIdentifiers('work-repo'), { database: 'obsidian-work-repo', username: 'vault-work-repo' })
  for (const invalid of ['', 'a', '-work', 'work_repo', 'WORK!', 'a'.repeat(31)]) {
    assert.throws(() => normalizeVaultSlug(invalid), HttpError)
  }
})

test('vault database filter excludes system and unrelated databases', () => {
  assert.equal(isVaultDatabase('obsidiannotes'), true)
  assert.equal(isVaultDatabase('obsidian-work'), true)
  assert.equal(isVaultDatabase('_users'), false)
  assert.equal(isVaultDatabase('portfolio'), false)
})

test('setup output parser extracts one-time access material', () => {
  const parsed = parseSetupOutput(`Generated couchdb Setup URI.\nEphemeral: usable until 2026-11-12T00:00:00.000Z (UTC).\nYour passphrase for the Setup URI is: secret\nID recovery code: sls-id-v1:abc\nobsidian://setuplivesync?settings=encrypted`)
  assert.equal(parsed.setupPassphrase, 'secret')
  assert.equal(parsed.recoveryCode, 'sls-id-v1:abc')
  assert.equal(parsed.setupUri, 'obsidian://setuplivesync?settings=encrypted')
  assert.throws(() => parseSetupOutput('invalid'), HttpError)
})

test('token comparison and protected container actions', () => {
  assert.equal(tokensMatch('same', 'same'), true)
  assert.equal(tokensMatch('wrong', 'same'), false)
  assert.throws(() => assertContainerAction('traefik', 'restart'), /защищён/)
  assert.throws(() => assertContainerAction('selickiy-landing-migrate-1', 'start'), /защищён/)
  assert.throws(() => assertContainerAction('hello-world', 'delete'), /start/)
  assert.doesNotThrow(() => assertContainerAction('hello-world', 'restart'))
})
