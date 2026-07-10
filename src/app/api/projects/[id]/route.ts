import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { normalizeExternalUrl, sanitizeRichHtml } from '@/lib/sanitize'
import { normalizeSlug } from '@/lib/slugs'
import { projectPatchSchema } from '@/lib/validation'

function serializeProject<T extends { techStack: string }>(project: T) {
  let techStack: string[] = []
  try { techStack = JSON.parse(project.techStack) as string[] } catch { /* use empty list */ }
  return { ...project, techStack }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const project = await prisma.project.findFirst({
    where: admin ? { id } : { id, status: 'PUBLISHED' },
  })
  if (!project) return apiError(404, 'NOT_FOUND', 'Проект не найден')
  return NextResponse.json(serializeProject(project))
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) return apiError(404, 'NOT_FOUND', 'Проект не найден')
    const input = await parseJson(request, projectPatchSchema)
    const slug = input.slug === undefined ? undefined : normalizeSlug(input.slug || input.title || existing.title, 'project')
    if (slug && slug !== existing.slug) {
      const collision = await prisma.project.findUnique({ where: { slug }, select: { id: true } })
      if (collision) return apiError(409, 'CONFLICT', 'Этот slug уже используется', { slug: 'Выберите другой slug' })
    }
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(slug !== undefined && { slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.previewUrl !== undefined && { previewUrl: input.previewUrl ? normalizeExternalUrl(input.previewUrl) : null }),
        ...(input.techStack !== undefined && { techStack: JSON.stringify(input.techStack) }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.stage !== undefined && { stage: input.stage }),
        ...(input.cardType !== undefined && { cardType: input.cardType }),
        ...(input.externalUrl !== undefined && { externalUrl: input.externalUrl ? normalizeExternalUrl(input.externalUrl) : null }),
        ...(input.pageContent !== undefined && { pageContent: input.pageContent ? sanitizeRichHtml(input.pageContent) : null }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    })
    invalidatePublicCache(CACHE_TAGS.projects)
    return NextResponse.json(serializeProject(project))
  } catch (error) {
    return unknownApiError(error, 'Не удалось обновить проект')
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return apiError(404, 'NOT_FOUND', 'Проект не найден')
    await prisma.project.delete({ where: { id } })
    invalidatePublicCache(CACHE_TAGS.projects)
    return NextResponse.json({ success: true })
  } catch (error) {
    return unknownApiError(error, 'Не удалось удалить проект')
  }
}
