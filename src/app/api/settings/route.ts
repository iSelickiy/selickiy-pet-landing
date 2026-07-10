import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { invalidatePublicCache, CACHE_TAGS } from '@/lib/cacheTags'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { settingsPayloadSchema } from '@/lib/validation'

const RICH_SETTING_KEYS = new Set(['aboutContent', 'skillsContent'])

export async function GET() {
  const settings = await prisma.siteSetting.findMany()
  return NextResponse.json(Object.fromEntries(settings.map(({ key, value }) => [key, value])))
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')

  try {
    const payload = await parseJson(request, settingsPayloadSchema)
    const rawSettings = 'settings' in payload ? payload.settings : { [payload.key]: payload.value }
    const settings = Object.fromEntries(
      Object.entries(rawSettings).map(([key, value]) => [
        key,
        RICH_SETTING_KEYS.has(key) ? sanitizeRichHtml(value) : value.trim(),
      ]),
    )

    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) => prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })),
    )

    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json({ settings })
  } catch (error) {
    return unknownApiError(error, 'Не удалось сохранить настройки')
  }
}
