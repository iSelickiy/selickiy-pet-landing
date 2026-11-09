import { NextResponse } from 'next/server'
import { getServerOverview } from '@/lib/controlPlane'
import { authorizeInfrastructure, infrastructureError } from '@/lib/infrastructureApi'

export async function GET(request: Request) {
  const denied = await authorizeInfrastructure(request)
  if (denied) return denied
  try {
    return NextResponse.json(await getServerOverview(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return infrastructureError(error, 'Не удалось получить состояние сервера')
  }
}
