import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const links = await prisma.socialLink.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(links)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { links } = await request.json()

  if (!Array.isArray(links)) {
    return NextResponse.json({ error: 'links must be an array' }, { status: 400 })
  }

  const results = await Promise.all(
    links.map((link: { platform: string; url: string; enabled: boolean }) =>
      prisma.socialLink.upsert({
        where: { platform: link.platform },
        update: { url: link.url, enabled: link.enabled },
        create: { platform: link.platform, url: link.url, enabled: link.enabled },
      })
    )
  )

  revalidatePath('/')
  return NextResponse.json(results)
}
