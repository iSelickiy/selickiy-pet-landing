import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '@/lib/api'
import { authorizeInfrastructure } from '@/lib/infrastructureApi'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  requireAdmin: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(requireAdmin).mockResolvedValue(true)
})

describe('infrastructure API authorization', () => {
  it('accepts a same-host mutation behind a reverse proxy', async () => {
    const request = new Request('http://internal:3000/api/admin/vaults', {
      method: 'POST',
      headers: { Origin: 'https://selickiy.space', Host: 'selickiy.space' },
    })
    await expect(authorizeInfrastructure(request, true)).resolves.toBeNull()
  })

  it('rejects a cross-origin mutation', async () => {
    const request = new Request('https://selickiy.space/api/admin/vaults', {
      method: 'POST',
      headers: { Origin: 'https://evil.example' },
    })
    const response = await authorizeInfrastructure(request, true)
    expect(response?.status).toBe(403)
  })

  it('rejects a malformed origin instead of throwing', async () => {
    const request = new Request('https://selickiy.space/api/admin/vaults', {
      method: 'POST',
      headers: { Origin: 'not a valid origin' },
    })
    const response = await authorizeInfrastructure(request, true)
    expect(response?.status).toBe(403)
  })

  it('requires an admin session for reads', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(false)
    const response = await authorizeInfrastructure(new Request('https://selickiy.space/api/admin/server'))
    expect(response?.status).toBe(401)
  })
})
