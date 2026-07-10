import { describe, expect, it } from 'vitest'
import { contactButtonsPayloadSchema, settingsPayloadSchema, socialLinksPayloadSchema } from '@/lib/validation'

describe('bulk validation', () => {
  it('accepts the new settings shape and legacy shape', () => {
    expect(settingsPayloadSchema.parse({ settings: { firstName: 'Игорь' } })).toBeTruthy()
    expect(settingsPayloadSchema.parse({ key: 'firstName', value: 'Игорь' })).toBeTruthy()
  })

  it('rejects unsafe contact protocols', () => {
    expect(() => contactButtonsPayloadSchema.parse({ buttons: [{ label: 'Bad', url: 'javascript:alert(1)', icon: 'link', sortOrder: 0 }] })).toThrow()
  })

  it('preserves social sort order', () => {
    const result = socialLinksPayloadSchema.parse({ links: [{ platform: 'telegram', url: 'https://t.me/example', enabled: true, sortOrder: 4 }] })
    expect(result.links[0].sortOrder).toBe(4)
  })
})
