import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, parseJson, requireAdmin, unknownApiError } from '@/lib/api'
import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'
import { normalizeExternalUrl, sanitizeRichHtml } from '@/lib/sanitize'
import { resolveUniqueSlug } from '@/lib/slugs'
import { projectPayloadSchema } from '@/lib/validation'

function serializeProject<T extends { techStack: string }>(project: T) {
  let techStack: string[] = []
  try { techStack = JSON.parse(project.techStack) as string[] } catch { /* use empty list */ }
  return { ...project, techStack }
}

export async function GET(request: NextRequest) {
  const wantsAll = request.nextUrl.searchParams.get('all') === 'true'
  if (wantsAll && !(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  const projects = await prisma.project.findMany({
    where: wantsAll ? undefined : { status: 'PUBLISHED' },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(projects.map(serializeProject))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const input = await parseJson(request, projectPayloadSchema)
    const slug = await resolveUniqueSlug(input.slug || input.title, async (candidate) =>
      Boolean(await prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } })),
    'project')
    const project = await prisma.project.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        previewUrl: input.previewUrl ? normalizeExternalUrl(input.previewUrl) : null,
        techStack: JSON.stringify(input.techStack),
        status: input.status,
        stage: input.stage,
        cardType: input.cardType,
        externalUrl: input.externalUrl ? normalizeExternalUrl(input.externalUrl) : null,
        pageContent: input.pageContent ? sanitizeRichHtml(input.pageContent) : null,
        sortOrder: input.sortOrder,
      },
    })
    invalidatePublicCache(CACHE_TAGS.projects)
    return NextResponse.json(serializeProject(project), { status: 201 })
  } catch (error) {
    return unknownApiError(error, 'Не удалось создать проект')
  }
}
