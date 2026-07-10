import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { resumePayloadSchema } from '@/lib/validation'

export async function GET() {
  return NextResponse.json(await prisma.resumeExperience.findMany({ orderBy: { sortOrder: 'asc' } }))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const input = await parseJson(request, resumePayloadSchema)
    const experience = await prisma.resumeExperience.create({
      data: { ...input, description: sanitizeRichHtml(input.description) },
    })
    invalidatePublicCache(CACHE_TAGS.resume)
    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    return unknownApiError(error, 'Не удалось добавить место работы')
  }
}
