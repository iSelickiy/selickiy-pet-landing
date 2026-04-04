'use client'

interface RichContentProps {
  html: string
}

export default function RichContent({ html }: RichContentProps) {
  return (
    <div
      className="rich-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
