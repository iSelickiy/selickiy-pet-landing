import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseJson, validationError } from '@/lib/api'
import { createVault, getVaults } from '@/lib/controlPlane'
import { authorizeInfrastructure, infrastructureError } from '@/lib/infrastructureApi'

const vaultSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9](?:[a-z0-9-]{0,27}[a-z0-9])?$/, '2–30 символов: латиница, цифры и дефис'),
})

export async function GET(request: Request) {
  const denied = await authorizeInfrastructure(request)
  if (denied) return denied
  try {
    return NextResponse.json({ vaults: await getVaults() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return infrastructureError(error, 'Не удалось получить vault’ы')
  }
}

export async function POST(request: Request) {
  const denied = await authorizeInfrastructure(request, true)
  if (denied) return denied
  try {
    const input = await parseJson(request, vaultSchema)
    const vault = await createVault(input.slug)
    return NextResponse.json({ vault }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(error)
    return infrastructureError(error, 'Не удалось создать vault')
  }
}
