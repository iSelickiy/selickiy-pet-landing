import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import slugify from 'slugify'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const all = searchParams.get('all')

  if (all === 'true') {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const projects = await prisma.project.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(
      projects.map((p) => ({ ...p, techStack: JSON.parse(p.techStack) }))
    )
  }

  const projects = await prisma.project.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(
    projects.map((p) => ({ ...p, techStack: JSON.parse(p.techStack) }))
  )
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, previewUrl, techStack, status, cardType, externalUrl, pageContent } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  let slug = slugify(title, { lower: true, strict: true })

  // Handle slug collisions
  const existing = await prisma.project.findUnique({ where: { slug } })
  if (existing) {
    let counter = 2
    while (await prisma.project.findUnique({ where: { slug: `${slug}-${counter}` } })) {
      counter++
    }
    slug = `${slug}-${counter}`
  }

  const project = await prisma.project.create({
    data: {
      title,
      slug,
      description,
      previewUrl: previewUrl || null,
      techStack: JSON.stringify(techStack || []),
      status: status || 'DRAFT',
      cardType: cardType || 'EXTERNAL_LINK',
      externalUrl: externalUrl || null,
      pageContent: pageContent || null,
    },
  })

  revalidatePath('/')
  return NextResponse.json({ ...project, techStack: JSON.parse(project.techStack) }, { status: 201 })
}
