import { NextResponse } from 'next/server'
import { apiError, requireAdmin } from '@/lib/api'
import { ControlPlaneError } from '@/lib/controlPlane'

export async function authorizeInfrastructure(request: Request, mutation = false) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  if (mutation) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host') || new URL(request.url).host
    let originHost: string | null = null
    try {
      originHost = origin ? new URL(origin).host : null
    } catch { /* reject malformed origins below */ }
    if (origin && originHost !== host) {
      return apiError(403, 'FORBIDDEN', 'Запрос отклонён: несовпадение origin')
    }
  }
  return null
}

export function infrastructureError(error: unknown, fallback: string) {
  if (error instanceof ControlPlaneError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
  }
  console.error(error)
  return apiError(500, 'INTERNAL_ERROR', fallback)
}
