import { updateTag } from 'next/cache'

export const CACHE_TAGS = {
  portfolio: 'portfolio',
  settings: 'settings',
  projects: 'projects',
  resume: 'resume',
  customPages: 'custom-pages',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

export function invalidatePublicCache(...tags: CacheTag[]) {
  updateTag(CACHE_TAGS.portfolio)
  for (const tag of new Set(tags)) {
    updateTag(tag)
  }
}
