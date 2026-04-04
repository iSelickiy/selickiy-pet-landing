'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'О себе', href: '#about' },
  { label: 'Резюме', href: '#resume' },
  { label: 'Проекты', href: '#projects' },
  { label: 'Контакты', href: '#contacts' },
]

export default function Nav() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-theme">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="text-lg font-bold text-text-primary">
          Игорь Селицкий
        </a>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-card-bg border border-border-theme hover:border-text-secondary/30 transition-colors"
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}

          <Link
            href="/admin/login"
            className="text-xs text-text-secondary/50 hover:text-text-secondary transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    </nav>
  )
}
