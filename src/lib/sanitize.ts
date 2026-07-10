import sanitizeHtml from 'sanitize-html'

const allowedTags = [
  'p', 'br', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li',
  'h2', 'h3', 'h4', 'a', 'code', 'pre', 'hr',
]

export function sanitizeRichHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { a: ['http', 'https', 'mailto', 'tel'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => {
        const href = attribs.href || ''
        const safeHref = /^(https?:|mailto:|tel:|\/|#)/i.test(href)
        if (!safeHref) return { tagName: 'a', attribs: {} }
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: attribs.target === '_blank' ? '_blank' : '_self',
            rel: attribs.target === '_blank' ? 'noopener noreferrer' : 'nofollow',
          },
        }
      },
    },
    disallowedTagsMode: 'discard',
  }).trim()
}

export function normalizeExternalUrl(input: string) {
  const value = input.trim()
  if (!value) return ''

  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) {
    return `mailto:${value}`
  }

  if (value.startsWith('/') || value.startsWith('#')) return value

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`
  const url = new URL(candidate)
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
    throw new Error('Unsupported URL protocol')
  }
  return url.toString()
}
