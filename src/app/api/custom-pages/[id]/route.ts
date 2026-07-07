import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { deleteCustomPageFile, saveCustomPageFile } from '@/lib/customPageStorage'
import { resolveUniqueCustomPageSlug, serializeCustomPage } from '@/lib/customPages'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customPage = await prisma.customPage.findUnique({ where: { id } })

  if (!customPage) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(serializeCustomPage(customPage))
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
  const existing = await prisma.customPage.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const title = String(formData.get('title') || '').trim()
  const requestedSlug = String(formData.get('slug') || '').trim()
  const status = String(formData.get('status') || existing.status)
  const folder = String(formData.get('folder') || '').trim()
  const tagsRaw = String(formData.get('tags') || '[]').trim()
  const maybeFile = formData.get('file')

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  try {
    const slug = await resolveUniqueCustomPageSlug(requestedSlug || title, existing.id)
    let storedFile = existing.storedFile
    let originalName = existing.originalName
    let size = existing.size

    if (maybeFile instanceof File && maybeFile.size > 0) {
      const storageResult = await saveCustomPageFile(maybeFile)
      storedFile = storageResult.storedFile
      originalName = storageResult.originalName
      size = storageResult.size
    }

    const updated = await prisma.customPage.update({
      where: { id },
      data: {
        title,
        slug,
        originalName,
        storedFile,
        size,
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        folder,
        tags: tagsRaw,
      },
    })

    if (storedFile !== existing.storedFile) {
      await deleteCustomPageFile(existing.storedFile)
    }

    revalidatePath('/admin/custom-pages')
    revalidatePath(`/custom/${existing.slug}`)
    revalidatePath(`/custom/${updated.slug}`)

    return NextResponse.json(serializeCustomPage(updated))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update custom page'
    return NextResponse.json({ error: message }, { status: 400 })
  }
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
  const existing = await prisma.customPage.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.customPage.delete({ where: { id } })
  await deleteCustomPageFile(existing.storedFile)

  revalidatePath('/admin/custom-pages')
  revalidatePath(`/custom/${existing.slug}`)

  return NextResponse.json({ success: true })
}
