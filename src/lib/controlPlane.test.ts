import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControlPlaneError, controlPlaneRequest, createVault, getVaults } from '@/lib/controlPlane'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('controlPlane client', () => {
  it('fails closed when internal configuration is missing', async () => {
    await expect(getVaults()).rejects.toMatchObject({ status: 503, code: 'CONTROL_PLANE_NOT_CONFIGURED' })
  })

  it('uses the service token and returns vault data', async () => {
    vi.stubEnv('CONTROL_PLANE_URL', 'http://bigvps-control:3100/')
    vi.stubEnv('CONTROL_PLANE_TOKEN', 'internal-token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vaults: [{ name: 'personal', database: 'obsidiannotes', documents: 1, sizeBytes: 10, status: 'ready' }] }))
    const vaults = await getVaults()
    expect(vaults).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith('http://bigvps-control:3100/v1/vaults', expect.objectContaining({ cache: 'no-store', headers: expect.objectContaining({ Authorization: 'Bearer internal-token' }) }))
  })

  it('sends only a validated slug when creating a vault', async () => {
    vi.stubEnv('CONTROL_PLANE_URL', 'http://control:3100')
    vi.stubEnv('CONTROL_PLANE_TOKEN', 'token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vault: { name: 'work' } }, { status: 201 }))
    await expect(createVault('work')).resolves.toEqual({ name: 'work' })
    expect(fetchMock).toHaveBeenCalledWith('http://control:3100/v1/vaults', expect.objectContaining({ method: 'POST', body: JSON.stringify({ slug: 'work' }), signal: expect.any(AbortSignal) }))
  })

  it('preserves safe control-plane errors', async () => {
    vi.stubEnv('CONTROL_PLANE_URL', 'http://control:3100')
    vi.stubEnv('CONTROL_PLANE_TOKEN', 'token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: { code: 'VAULT_EXISTS', message: 'Такой vault уже существует' } }, { status: 409 }))
    await expect(createVault('work')).rejects.toEqual(new ControlPlaneError(409, 'Такой vault уже существует', 'VAULT_EXISTS'))
  })

  it('maps network failures to a temporary availability error', async () => {
    vi.stubEnv('CONTROL_PLANE_URL', 'http://control:3100')
    vi.stubEnv('CONTROL_PLANE_TOKEN', 'token')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('connect failed'))
    await expect(controlPlaneRequest('/v1/server')).rejects.toMatchObject({ status: 502, code: 'CONTROL_PLANE_UNAVAILABLE' })
  })
})
