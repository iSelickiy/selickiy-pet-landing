import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const settings = await prisma.siteSetting.findMany()
  const result: Record<string, string> = {}
  for (const setting of settings) {
    result[setting.key] = setting.value
  }
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await request.json()

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  revalidatePath('/')
  return NextResponse.json(setting)
}
