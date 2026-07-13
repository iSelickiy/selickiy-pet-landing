import { Pulse, TerminalWindow } from '@phosphor-icons/react/dist/ssr'

interface FooterProps {
  firstName: string
  lastName: string
  tagline: string
}

export default async function Footer({ firstName, lastName, tagline }: FooterProps) {
  'use cache'
  cacheLife('days')
  const year = new Date().getFullYear()
  return (
    <footer className="mb-2 mt-2 rounded-xl border border-dashed border-border-theme px-4 py-3 text-xs text-text-secondary">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-3"><TerminalWindow size={17} className="text-text-primary" /> Строю продукты, автоматизирую рутину, ищу простые решения сложных задач.</p>
        <p className="flex shrink-0 items-center gap-2"><Pulse size={17} className="text-emerald-500" /> build: {year}</p>
      </div>
      <p className="sr-only">© {year} {firstName} {lastName} · {tagline}</p>
    </footer>
  )
}
import { cacheLife } from 'next/cache'
