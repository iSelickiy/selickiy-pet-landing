import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { resolveUniqueCustomPageSlug, serializeCustomPage } from '@/lib/customPages'
import { saveCustomPageFile } from '@/lib/customPageStorage'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() || ''
  const folder = searchParams.get('folder')?.trim() || ''
  const tag = searchParams.get('tag')?.trim() || ''

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (folder) {
    where.folder = folder
  }

  if (tag) {
    where.tags = { contains: tag }
  }

  const customPages = await prisma.customPage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(customPages.map(serializeCustomPage))
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const title = String(formData.get('title') || '').trim()
  const requestedSlug = String(formData.get('slug') || '').trim()
  const status = String(formData.get('status') || 'DRAFT')
  const folder = String(formData.get('folder') || '').trim()
  const tagsRaw = String(formData.get('tags') || '[]').trim()
  const file = formData.get('file')

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'HTML file is required' }, { status: 400 })
  }

  try {
    const storageResult = await saveCustomPageFile(file)
    const slug = await resolveUniqueCustomPageSlug(requestedSlug || title)

    const customPage = await prisma.customPage.create({
      data: {
        title,
        slug,
        originalName: storageResult.originalName,
        storedFile: storageResult.storedFile,
        size: storageResult.size,
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        folder,
        tags: tagsRaw,
      },
    })

    revalidatePath('/admin/custom-pages')
    revalidatePath(`/custom/${customPage.slug}`)

    return NextResponse.json(serializeCustomPage(customPage), { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create custom page'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
