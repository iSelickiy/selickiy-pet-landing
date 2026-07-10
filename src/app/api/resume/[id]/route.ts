import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { resumePatchSchema } from '@/lib/validation'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    const input = await parseJson(request, resumePatchSchema)
    const experience = await prisma.resumeExperience.update({
      where: { id },
      data: {
        ...input,
        ...(input.description !== undefined && { description: sanitizeRichHtml(input.description) }),
      },
    })
    invalidatePublicCache(CACHE_TAGS.resume)
    return NextResponse.json(experience)
  } catch (error) {
    return unknownApiError(error, 'Не удалось обновить место работы')
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    await prisma.resumeExperience.delete({ where: { id } })
    invalidatePublicCache(CACHE_TAGS.resume)
    return NextResponse.json({ success: true })
  } catch (error) {
    return unknownApiError(error, 'Не удалось удалить место работы')
  }
}
