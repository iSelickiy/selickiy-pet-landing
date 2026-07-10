import { describe, expect, it } from 'vitest'
import { normalizeExternalUrl, sanitizeRichHtml } from '@/lib/sanitize'

describe('sanitizeRichHtml', () => {
  it('removes scripts, event handlers and unsafe protocols', () => {
    const result = sanitizeRichHtml('<p onclick="alert(1)">OK<script>alert(1)</script><a href="javascript:alert(1)">bad</a></p>')
    expect(result).toBe('<p>OK<a>bad</a></p>')
  })

  it('keeps safe external links isolated', () => {
    expect(sanitizeRichHtml('<a href="https://example.com" target="_blank">site</a>')).toContain('rel="noopener noreferrer"')
  })
})

describe('normalizeExternalUrl', () => {
  it('turns plain email addresses into mailto links', () => {
    expect(normalizeExternalUrl('igor@example.com')).toBe('mailto:igor@example.com')
  })

  it('rejects unsupported protocols', () => {
    expect(() => normalizeExternalUrl('javascript:alert(1)')).toThrow('Unsupported URL protocol')
  })
})
