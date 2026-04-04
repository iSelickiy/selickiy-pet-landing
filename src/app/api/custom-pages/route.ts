import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { resolveUniqueCustomPageSlug, serializeCustomPage } from '@/lib/customPages'
import { saveCustomPageFile } from '@/lib/customPageStorage'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customPages = await prisma.customPage.findMany({
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
