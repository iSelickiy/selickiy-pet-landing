import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ids } = await request.json() as { ids: string[] }

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids must be an array' }, { status: 400 })
  }

  await Promise.all(
    ids.map((id, index) =>
      prisma.project.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath('/')
  return NextResponse.json({ success: true })
}
