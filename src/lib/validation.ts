import { z } from 'zod'

const trimmedString = (max: number) => z.string().trim().max(max)
const requiredString = (max: number) => trimmedString(max).min(1, 'Обязательное поле')
const safeUrl = trimmedString(2048).refine((value) => {
  if (!value) return true
  if (value.startsWith('/') || value.startsWith('#')) return true
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) return true
  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(candidate).protocol)
  } catch {
    return false
  }
}, 'Некорректная ссылка')

export const settingsPayloadSchema = z.union([
  z.object({ settings: z.record(z.string().max(100), z.string().max(100_000)) }),
  z.object({ key: requiredString(100), value: z.string().max(100_000) }),
])

export const contactButtonSchema = z.object({
  id: z.string().cuid().optional(),
  label: requiredString(80),
  url: safeUrl.refine(Boolean, 'Обязательное поле'),
  icon: trimmedString(40).default('link'),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
})

export const contactButtonsPayloadSchema = z.object({
  buttons: z.array(contactButtonSchema).max(30),
})

export const socialLinksPayloadSchema = z.object({
  links: z.array(z.object({
    platform: requiredString(40),
    url: safeUrl,
    enabled: z.boolean(),
    sortOrder: z.number().int().min(0).max(10_000),
  })).max(30),
})

export const projectPayloadSchema = z.object({
  title: requiredString(160),
  slug: trimmedString(180).optional(),
  description: requiredString(2_000),
  previewUrl: safeUrl.nullish(),
  techStack: z.array(requiredString(40)).max(30).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  stage: trimmedString(60).default('В процессе'),
  cardType: z.enum(['EXTERNAL_LINK', 'DETAIL_PAGE']).default('EXTERNAL_LINK'),
  externalUrl: safeUrl.nullish(),
  pageContent: z.string().max(250_000).nullish(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
})

export const projectPatchSchema = projectPayloadSchema.partial()

export const resumePayloadSchema = z.object({
  company: requiredString(160),
  position: requiredString(160),
  periodFrom: requiredString(40),
  periodTo: requiredString(40),
  description: z.string().max(250_000).default(''),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
})

export const resumePatchSchema = resumePayloadSchema.partial()

export const reorderPayloadSchema = z.object({
  ids: z.array(z.string().cuid()).max(1_000),
})

export const contentPayloadSchema = z.object({
  key: requiredString(100),
  content: z.string().max(250_000),
})

export const customPageFieldsSchema = z.object({
  title: requiredString(160),
  slug: trimmedString(180),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  folder: trimmedString(120),
  tags: z.array(requiredString(40)).max(30),
})
