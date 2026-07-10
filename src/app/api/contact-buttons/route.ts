import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { normalizeExternalUrl } from '@/lib/sanitize'
import { contactButtonSchema, contactButtonsPayloadSchema } from '@/lib/validation'

export async function GET() {
  return NextResponse.json(await prisma.contactButton.findMany({ orderBy: { sortOrder: 'asc' } }))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const input = await parseJson(request, contactButtonSchema)
    const button = await prisma.contactButton.create({
      data: { ...input, id: undefined, url: normalizeExternalUrl(input.url) },
    })
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json(button, { status: 201 })
  } catch (error) {
    return unknownApiError(error, 'Не удалось создать кнопку')
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { buttons } = await parseJson(request, contactButtonsPayloadSchema)
    const saved = await prisma.$transaction(async (tx) => {
      const retainedIds = buttons.flatMap(({ id }) => id ? [id] : [])
      await tx.contactButton.deleteMany({ where: retainedIds.length ? { id: { notIn: retainedIds } } : {} })
      for (const [index, button] of buttons.entries()) {
        const data = {
          label: button.label,
          url: normalizeExternalUrl(button.url),
          icon: button.icon,
          sortOrder: index,
        }
        if (button.id) await tx.contactButton.update({ where: { id: button.id }, data })
        else await tx.contactButton.create({ data })
      }
      return tx.contactButton.findMany({ orderBy: { sortOrder: 'asc' } })
    })
    invalidatePublicCache(CACHE_TAGS.settings)
    return NextResponse.json(saved)
  } catch (error) {
    return unknownApiError(error, 'Не удалось сохранить кнопки')
  }
}
