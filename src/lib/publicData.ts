import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS } from '@/lib/cacheTags'
import { readCustomPageFile } from '@/lib/customPageStorage'

function parseStringArray(value: string) {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

function developmentFallback() {
  return {
    settings: {
      firstName: 'Игорь',
      lastName: 'Селицкий',
      tagline: 'Биздев — техноэнтузиаст',
      introText: 'Развиваю продажи, запускаю новые направления и иногда собираю веб‑проекты просто потому, что могу.',
    } as Record<string, string>,
    content: {} as Record<string, string>,
    socialLinks: [
      { id: 'dev-telegram', platform: 'telegram', url: 'https://t.me/iselickiy', enabled: true, sortOrder: 0 },
      { id: 'dev-email', platform: 'email', url: 'i.selickiy@yandex.ru', enabled: true, sortOrder: 1 },
      { id: 'dev-github', platform: 'github', url: 'https://github.com/selickiy', enabled: true, sortOrder: 2 },
    ],
    experiences: [
      { id: 'dev-exp-1', company: 'Mindbox', position: 'Менеджер по развитию бизнеса', periodFrom: '2025', periodTo: 'сейчас', description: '<p>Развитие текущей базы, кросс‑селлы, апселлы и запуск новых направлений.</p>', sortOrder: 0, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'dev-exp-2', company: 'Mindbox', position: 'Customer Success Manager', periodFrom: '2022', periodTo: '2025', description: '<p>Запуски программ лояльности, CRM‑стратегия и развитие клиентов.</p>', sortOrder: 1, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'dev-exp-3', company: 'VAPETIGER', position: 'Маркетинг и продажи', periodFrom: '2016', periodTo: '2021', description: '<p>Интернет‑магазин, маркетплейсы, партнёрства и отдел продаж.</p>', sortOrder: 2, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
    ],
    projects: [
      { id: 'dev-project-1', title: 'CRM ROI Калькулятор', slug: 'crm-roi-calculator', description: 'Утилита для быстрой оценки окупаемости CRM‑платформы.', previewUrl: null, techStack: ['Next.js', 'React', 'Tailwind CSS'], status: 'PUBLISHED' as const, stage: 'Живой', cardType: 'DETAIL_PAGE' as const, externalUrl: null, pageContent: null, sortOrder: 0, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'dev-project-2', title: 'Чек‑лист запуска программы лояльности', slug: 'loyalty-program-launcher', description: 'Интерактивный список шагов от стратегии до запуска.', previewUrl: null, techStack: ['React', 'TypeScript'], status: 'PUBLISHED' as const, stage: 'В процессе', cardType: 'DETAIL_PAGE' as const, externalUrl: null, pageContent: null, sortOrder: 1, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
      { id: 'dev-project-3', title: 'Email Template Builder', slug: 'email-template-builder', description: 'Небольшой drag & drop конструктор email‑шаблонов.', previewUrl: null, techStack: ['Next.js', 'Tiptap'], status: 'PUBLISHED' as const, stage: 'Прототип', cardType: 'EXTERNAL_LINK' as const, externalUrl: 'https://github.com/selickiy', pageContent: null, sortOrder: 2, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') },
    ],
  }
}

export async function getPortfolioData() {
  'use cache'
  cacheLife('hours')
  cacheTag(
    CACHE_TAGS.portfolio,
    CACHE_TAGS.settings,
    CACHE_TAGS.projects,
    CACHE_TAGS.resume,
  )

  let rows
  try {
    rows = await Promise.all([
      prisma.contentSection.findMany(),
      prisma.project.findMany({ where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } }),
      prisma.siteSetting.findMany(),
      prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.resumeExperience.findMany({ orderBy: { sortOrder: 'asc' } }),
    ] as const)
  } catch (error) {
    console.error('Failed to load cached portfolio data', error)
    if (process.env.NODE_ENV === 'development') return developmentFallback()
    return {
      settings: {} as Record<string, string>,
      content: {} as Record<string, string>,
      socialLinks: [],
      projects: [],
      experiences: [],
    }
  }
  const [sections, projects, settingsRows, socialLinks, experiences] = rows

  return {
    settings: Object.fromEntries(settingsRows.map(({ key, value }) => [key, value])),
    content: Object.fromEntries(sections.map(({ key, content }) => [key, content])),
    socialLinks,
    projects: projects.map((project) => ({
      ...project,
      techStack: parseStringArray(project.techStack),
    })),
    experiences,
  }
}

export async function getPublishedProject(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.projects, `project:${slug}`)
  try {
    const project = await prisma.project.findFirst({ where: { slug, status: 'PUBLISHED' } })
    return project ? { ...project, techStack: parseStringArray(project.techStack) } : null
  } catch (error) {
    console.error('Failed to load cached project', error)
    return null
  }
}

export async function getPublishedCustomPage(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.customPages, `custom-page:${slug}`)
  try {
    return await prisma.customPage.findFirst({ where: { slug, status: 'PUBLISHED' } })
  } catch (error) {
    console.error('Failed to load cached custom page', error)
    return null
  }
}

export async function getPublishedCustomPageDocument(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(CACHE_TAGS.customPages, `custom-page:${slug}`)
  try {
    const page = await prisma.customPage.findFirst({ where: { slug, status: 'PUBLISHED' } })
    if (!page) return null
    return { page, html: await readCustomPageFile(page.storedFile) }
  } catch (error) {
    console.error('Failed to load cached custom page document', error)
    return null
  }
}
