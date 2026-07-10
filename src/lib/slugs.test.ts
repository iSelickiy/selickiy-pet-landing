import { describe, expect, it } from 'vitest'
import { normalizeSlug, resolveUniqueSlug } from '@/lib/slugs'

describe('slug helpers', () => {
  it('normalizes Cyrillic and punctuation safely', () => {
    expect(normalizeSlug('  CRM ROI: калькулятор  ')).toBe('crm-roi-kalkulyator')
  })

  it('increments until it finds a free slug', async () => {
    const taken = new Set(['project', 'project-2', 'project-3'])
    await expect(resolveUniqueSlug('Project', async (slug) => taken.has(slug))).resolves.toBe('project-4')
  })
})
