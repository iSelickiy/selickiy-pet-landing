import { revalidateTag } from 'next/cache'

export const CACHE_TAGS = {
  portfolio: 'portfolio',
  settings: 'settings',
  projects: 'projects',
  resume: 'resume',
  customPages: 'custom-pages',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

export function invalidatePublicCache(...tags: CacheTag[]) {
  revalidateTag(CACHE_TAGS.portfolio, { expire: 0 })
  for (const tag of new Set(tags)) {
    revalidateTag(tag, { expire: 0 })
  }
}
