import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseJson, validationError } from '@/lib/api'
import { runContainerAction } from '@/lib/controlPlane'
import { authorizeInfrastructure, infrastructureError } from '@/lib/infrastructureApi'

const actionSchema = z.object({ action: z.enum(['start', 'stop', 'restart']) })

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const denied = await authorizeInfrastructure(request, true)
  if (denied) return denied
  try {
    const [{ name }, input] = await Promise.all([params, parseJson(request, actionSchema)])
    return NextResponse.json(await runContainerAction(name, input.action), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(error)
    return infrastructureError(error, 'Не удалось изменить состояние контейнера')
  }
}
