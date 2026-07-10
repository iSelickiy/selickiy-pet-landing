import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { normalizeExternalUrl } from '@/lib/sanitize'
import { socialLinksPayloadSchema } from '@/lib/validation'

export async function GET() {
  return NextResponse.json(await prisma.socialLink.findMany({ orderBy: { sortOrder: 'asc' } }))
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { links } = await parseJson(request, socialLinksPayloadSchema)
    const results = await prisma.$transaction(
      links.map((link) => prisma.socialLink.upsert({
        where: { platform: link.platform },
        update: {
          url: link.url ? normalizeExternalUrl(link.url) : '',
          enabled: link.enabled,
          sortOrder: link.sortOrder,
        },
        create: {
          platform: link.platform,
          url: link.url ? normalizeExternalUrl(link.url) : '',
          enabled: link.enabled,
          sortOrder: link.sortOrder,
        },
      })),
    )
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json(results)
  } catch (error) {
    return unknownApiError(error, 'Не удалось сохранить социальные ссылки')
  }
}
