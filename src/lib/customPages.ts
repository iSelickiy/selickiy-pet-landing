import slugify from 'slugify'
import { prisma } from '@/lib/prisma'

export interface CustomPageRecord {
  id: string
  title: string
  slug: string
  originalName: string
  storedFile: string
  size: number
  status: 'DRAFT' | 'PUBLISHED'
  folder: string
  tags: string
  createdAt: Date
  updatedAt: Date
}

export function normalizeCustomPageSlug(input: string, fallback = 'custom-page') {
  return slugify(input, { lower: true, strict: true, trim: true }) || fallback
}

export async function resolveUniqueCustomPageSlug(input: string, excludeId?: string) {
  const baseSlug = normalizeCustomPageSlug(input)
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.customPage.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}

export function serializeCustomPage(customPage: CustomPageRecord) {
  return {
    ...customPage,
    createdAt: customPage.createdAt.toISOString(),
    updatedAt: customPage.updatedAt.toISOString(),
  }
}
