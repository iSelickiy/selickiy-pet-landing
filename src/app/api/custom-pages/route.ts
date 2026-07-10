import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireAdmin, unknownApiError, validationError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { deleteCustomPageFile, MAX_CUSTOM_PAGE_BYTES, saveCustomPageFile } from '@/lib/customPageStorage'
import { resolveUniqueCustomPageSlug, serializeCustomPage } from '@/lib/customPages'
import { customPageFieldsSchema } from '@/lib/validation'
import { ZodError } from 'zod'

function parseTags(raw: FormDataEntryValue | null) {
  try {
    const value: unknown = JSON.parse(String(raw || '[]'))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim() || ''
  const folder = searchParams.get('folder')?.trim() || ''
  const tag = searchParams.get('tag')?.trim() || ''
  const customPages = await prisma.customPage.findMany({
    where: {
      ...(search && { OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ] }),
      ...(folder && { folder }),
      ...(tag && { tags: { contains: tag } }),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(customPages.map(serializeCustomPage))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  let storedFile: string | null = null
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_CUSTOM_PAGE_BYTES + 1_000_000) return apiError(413, 'PAYLOAD_TOO_LARGE', 'HTML-файл слишком большой')
    const formData = await request.formData()
    const fields = customPageFieldsSchema.parse({
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || ''),
      status: String(formData.get('status') || 'DRAFT'),
      folder: String(formData.get('folder') || ''),
      tags: parseTags(formData.get('tags')),
    })
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Выберите HTML-файл', { file: 'Файл обязателен' })
    }
    const storage = await saveCustomPageFile(file)
    storedFile = storage.storedFile
    const slug = await resolveUniqueCustomPageSlug(fields.slug || fields.title)
    const customPage = await prisma.customPage.create({
      data: {
        ...fields,
        slug,
        tags: JSON.stringify(fields.tags),
        originalName: storage.originalName,
        storedFile: storage.storedFile,
        size: storage.size,
      },
    })
    invalidatePublicCache(CACHE_TAGS.customPages)
    return NextResponse.json(serializeCustomPage(customPage), { status: 201 })
  } catch (error) {
    if (storedFile) await deleteCustomPageFile(storedFile).catch(() => undefined)
    if (error instanceof ZodError) return validationError(error)
    if (error instanceof Error && /Only .html|valid HTML|smaller/.test(error.message)) {
      return apiError(415, 'UNSUPPORTED_MEDIA_TYPE', error.message, { file: error.message })
    }
    return unknownApiError(error, 'Не удалось создать custom page')
  }
}
