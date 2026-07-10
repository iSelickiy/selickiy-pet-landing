import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { reorderPayloadSchema } from '@/lib/validation'

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { ids } = await parseJson(request, reorderPayloadSchema)
    if (new Set(ids).size !== ids.length) {
      return apiError(400, 'VALIDATION_ERROR', 'Список содержит дубликаты', { ids: 'Удалите повторяющиеся ID' })
    }
    await prisma.$transaction(ids.map((id, index) => prisma.project.update({ where: { id }, data: { sortOrder: index } })))
    invalidatePublicCache(CACHE_TAGS.projects)
    return NextResponse.json({ success: true })
  } catch (error) {
    return unknownApiError(error, 'Не удалось изменить порядок проектов')
  }
}
