import { sanitizeRichHtml } from '@/lib/sanitize'

interface RichContentProps {
  html: string
  className?: string
}

export default function RichContent({ html, className = '' }: RichContentProps) {
  return (
    <div
      className={`rich-content max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }}
    />
  )
}
