import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { normalizeExternalUrl } from '@/lib/sanitize'
import { contactButtonSchema } from '@/lib/validation'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    const input = await parseJson(request, contactButtonSchema)
    const button = await prisma.contactButton.update({
      where: { id },
      data: { ...input, id: undefined, url: normalizeExternalUrl(input.url) },
    })
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json(button)
  } catch (error) {
    return unknownApiError(error, 'Не удалось обновить кнопку')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    await prisma.contactButton.delete({ where: { id } })
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json({ success: true })
  } catch (error) {
    return unknownApiError(error, 'Не удалось удалить кнопку')
  }
}
