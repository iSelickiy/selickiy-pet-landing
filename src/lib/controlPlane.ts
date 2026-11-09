import type { ContainerAction, ServerOverview, VaultAccessKit, VaultSummary } from '@/lib/infrastructureTypes'

export class ControlPlaneError extends Error {
  status: number
  code: string

  constructor(status: number, message: string, code = 'CONTROL_PLANE_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

function configuration() {
  const baseUrl = process.env.CONTROL_PLANE_URL?.replace(/\/$/, '')
  const token = process.env.CONTROL_PLANE_TOKEN
  if (!baseUrl || !token) {
    throw new ControlPlaneError(503, 'Управление инфраструктурой ещё не настроено', 'CONTROL_PLANE_NOT_CONFIGURED')
  }
  return { baseUrl, token }
}

export async function controlPlaneRequest<T>(path: string, init: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const { baseUrl, token } = configuration()
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    if (error instanceof ControlPlaneError) throw error
    throw new ControlPlaneError(502, 'Control-plane временно недоступен', 'CONTROL_PLANE_UNAVAILABLE')
  }
  if (!response.ok) {
    let message = `Control-plane вернул ${response.status}`
    let code = 'CONTROL_PLANE_ERROR'
    try {
      const body = await response.json() as { error?: { message?: string; code?: string } }
      message = body.error?.message || message
      code = body.error?.code || code
    } catch { /* keep generic status error */ }
    throw new ControlPlaneError(response.status, message, code)
  }
  return response.json() as Promise<T>
}

export async function getVaults() {
  const result = await controlPlaneRequest<{ vaults: VaultSummary[] }>('/v1/vaults')
  return result.vaults
}

export async function createVault(slug: string) {
  const result = await controlPlaneRequest<{ vault: VaultAccessKit }>('/v1/vaults', {
    method: 'POST',
    body: JSON.stringify({ slug }),
  }, 150000)
  return result.vault
}

export function getServerOverview() {
  return controlPlaneRequest<ServerOverview>('/v1/server')
}

export function runContainerAction(name: string, action: ContainerAction) {
  return controlPlaneRequest<{ success: true; name: string; action: ContainerAction }>(`/v1/containers/${encodeURIComponent(name)}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  }, 45000)
}
