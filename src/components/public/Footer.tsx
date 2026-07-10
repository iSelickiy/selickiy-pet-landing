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
    <footer className="mt-10 flex flex-col gap-2 border-t border-border-theme py-6 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <p>© {year} {firstName} {lastName}</p>
      <p>{tagline} · Next.js + PostgreSQL</p>
    </footer>
  )
}
import { cacheLife } from 'next/cache'
