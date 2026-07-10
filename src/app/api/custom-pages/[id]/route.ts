import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, requireAdmin, unknownApiError, validationError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import {
  deleteCustomPageFile,
  quarantineCustomPageFile,
  saveCustomPageFile,
} from '@/lib/customPageStorage'
import { resolveUniqueCustomPageSlug, serializeCustomPage } from '@/lib/customPages'
import { customPageFieldsSchema } from '@/lib/validation'

function parseTags(raw: FormDataEntryValue | null) {
  try {
    const value: unknown = JSON.parse(String(raw || '[]'))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  const { id } = await params
  const customPage = await prisma.customPage.findUnique({ where: { id } })
  if (!customPage) return apiError(404, 'NOT_FOUND', 'Страница не найдена')
  return NextResponse.json(serializeCustomPage(customPage))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  const { id } = await params
  const existing = await prisma.customPage.findUnique({ where: { id } })
  if (!existing) return apiError(404, 'NOT_FOUND', 'Страница не найдена')

  let newStoredFile: string | null = null
  let quarantine: Awaited<ReturnType<typeof quarantineCustomPageFile>> | null = null
  try {
    const formData = await request.formData()
    const fields = customPageFieldsSchema.parse({
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || ''),
      status: String(formData.get('status') || existing.status),
      folder: String(formData.get('folder') || ''),
      tags: parseTags(formData.get('tags')),
    })
    const slug = await resolveUniqueCustomPageSlug(fields.slug || fields.title, existing.id)
    const maybeFile = formData.get('file')
    let storage = {
      storedFile: existing.storedFile,
      originalName: existing.originalName,
      size: existing.size,
    }
    if (maybeFile instanceof File && maybeFile.size > 0) {
      storage = await saveCustomPageFile(maybeFile)
      newStoredFile = storage.storedFile
      quarantine = await quarantineCustomPageFile(existing.storedFile)
    }

    let updated
    try {
      updated = await prisma.customPage.update({
        where: { id },
        data: {
          ...fields,
          slug,
          tags: JSON.stringify(fields.tags),
          originalName: storage.originalName,
          storedFile: storage.storedFile,
          size: storage.size,
        },
      })
    } catch (error) {
      if (quarantine) await quarantine.restore().catch(() => undefined)
      if (newStoredFile) await deleteCustomPageFile(newStoredFile).catch(() => undefined)
      throw error
    }

    if (quarantine) await quarantine.remove()
    invalidatePublicCache(CACHE_TAGS.customPages)
    return NextResponse.json(serializeCustomPage(updated))
  } catch (error) {
    if (error instanceof ZodError) return validationError(error)
    if (error instanceof Error && /Only .html|valid HTML|smaller/.test(error.message)) {
      return apiError(415, 'UNSUPPORTED_MEDIA_TYPE', error.message, { file: error.message })
    }
    return unknownApiError(error, 'Не удалось обновить custom page')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  const { id } = await params
  const existing = await prisma.customPage.findUnique({ where: { id } })
  if (!existing) return apiError(404, 'NOT_FOUND', 'Страница не найдена')

  const quarantine = await quarantineCustomPageFile(existing.storedFile)
  try {
    await prisma.customPage.delete({ where: { id } })
  } catch (error) {
    await quarantine.restore().catch(() => undefined)
    return unknownApiError(error, 'Не удалось удалить custom page')
  }
  await quarantine.remove()
  invalidatePublicCache(CACHE_TAGS.customPages)
  return NextResponse.json({ success: true })
}
