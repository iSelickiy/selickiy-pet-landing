import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { contentPayloadSchema } from '@/lib/validation'

export async function GET() {
  const sections = await prisma.contentSection.findMany()
  return NextResponse.json(Object.fromEntries(sections.map(({ key, content }) => [key, content])))
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const input = await parseJson(request, contentPayloadSchema)
    const content = sanitizeRichHtml(input.content)
    const section = await prisma.contentSection.upsert({
      where: { key: input.key },
      update: { content },
      create: { key: input.key, content },
    })
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json(section)
  } catch (error) {
    return unknownApiError(error, 'Не удалось сохранить контент')
  }
}
