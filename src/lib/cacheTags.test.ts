import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }))

vi.mock('next/cache', () => ({ revalidateTag }))

import { CACHE_TAGS, invalidatePublicCache } from '@/lib/cacheTags'

describe('invalidatePublicCache', () => {
  beforeEach(() => {
    revalidateTag.mockClear()
  })

  it('expires route-handler cache tags immediately', () => {
    invalidatePublicCache(CACHE_TAGS.customPages)

    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(revalidateTag).toHaveBeenNthCalledWith(1, CACHE_TAGS.portfolio, { expire: 0 })
    expect(revalidateTag).toHaveBeenNthCalledWith(2, CACHE_TAGS.customPages, { expire: 0 })
  })

  it('does not invalidate duplicate tags twice', () => {
    invalidatePublicCache(CACHE_TAGS.projects, CACHE_TAGS.projects)

    expect(revalidateTag).toHaveBeenCalledTimes(2)
  })
})
