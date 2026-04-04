import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const sections = await prisma.contentSection.findMany()
  const result: Record<string, string> = {}
  for (const section of sections) {
    result[section.key] = section.content
  }
  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, content } = await request.json()

  if (!key || content === undefined) {
    return NextResponse.json({ error: 'key and content are required' }, { status: 400 })
  }

  const section = await prisma.contentSection.upsert({
    where: { key },
    update: { content },
    create: { key, content },
  })

  revalidatePath('/')
  return NextResponse.json(section)
}
