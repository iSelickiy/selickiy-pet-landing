import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ...project, techStack: JSON.parse(project.techStack) })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  const allowedFields = [
    'title', 'slug', 'description', 'previewUrl', 'status',
    'cardType', 'externalUrl', 'pageContent', 'sortOrder',
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field]
    }
  }

  if (body.techStack !== undefined) {
    data.techStack = JSON.stringify(body.techStack)
  }

  const project = await prisma.project.update({
    where: { id },
    data,
  })

  revalidatePath('/')
  return NextResponse.json({ ...project, techStack: JSON.parse(project.techStack) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.project.delete({ where: { id } })

  revalidatePath('/')
  return NextResponse.json({ success: true })
}
