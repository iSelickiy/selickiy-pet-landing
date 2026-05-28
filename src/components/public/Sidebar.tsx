'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import RichContent from '@/components/ui/RichContent'
import { useIsMounted } from '@/lib/useIsMounted'

interface SidebarProps {
  firstName: string
  lastName: string
  avatarUrl: string | null
  avatarMode: 'static' | 'dynamic'
  avatarDarkUrl: string | null
  aboutContent: string
  contactButtons: Array<{ id: string; label: string; url: string; icon: string }>
  socialLinks: Array<{ platform: string; url: string }>
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  telegram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  vk: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.162 18.994c.5 0 .5-1.217.5-1.217s-.028-1.463.626-1.678c.646-.21 1.476 1.397 2.356 2.015.667.468 1.173.365 1.173.365l2.354-.033s1.232-.077.648-.999c-.048-.075-.34-.672-1.748-1.9-1.476-1.286-1.278-1.078.5-3.305 1.082-1.356 1.515-2.183 1.38-2.536-.129-.336-.921-.247-.921-.247l-2.65.017s-.197-.027-.343.06c-.143.087-.236.29-.236.29s-.423 1.13-.987 2.09c-1.19 2.023-1.666 2.13-1.86 2.003-.453-.296-.34-1.188-.34-1.822 0-1.98.3-2.808-.583-3.022-.293-.071-.509-.117-1.258-.125-.96-.01-1.773.003-2.233.229-.306.15-.543.487-.399.506.178.024.58.108.793.4.276.376.266 1.22.266 1.22s.159 2.33-.37 2.62c-.363.198-.86-.207-1.93-2.061-.548-.95-.962-1.998-.962-1.998s-.08-.195-.222-.3c-.172-.127-.413-.167-.413-.167l-2.52.017s-.378.01-.517.175c-.124.146-.01.45-.01.45s1.992 4.66 4.248 7.01c2.066 2.156 4.412 2.014 4.412 2.014h1.063z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  habr: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.77 2H2.23A2.23 2.23 0 000 4.23v15.54A2.23 2.23 0 002.23 22h19.54A2.23 2.23 0 0024 19.77V4.23A2.23 2.23 0 0021.77 2zM7.5 17H5.25V7H7.5v4h4V7h2.25v10H11.5v-4h-4v4zm12.25 0h-2.25v-4h-3v4H12.25V7h2.25v4h3V7h2.25v10z" />
    </svg>
  ),
}

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  calendar: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  link: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.096a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" />
    </svg>
  ),
  message: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
}

export default function Sidebar({
  firstName,
  lastName,
  avatarUrl,
  avatarMode,
  avatarDarkUrl,
  aboutContent,
  contactButtons,
  socialLinks,
}: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const isDark = mounted && theme === 'dark'
  const displayAvatarUrl = avatarMode === 'dynamic' && isDark && avatarDarkUrl ? avatarDarkUrl : avatarUrl

  const avatarElement = displayAvatarUrl ? (
    <img
      src={displayAvatarUrl}
      alt={`${firstName} ${lastName}`}
      className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
    />
  ) : (
    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
      <span className="text-2xl font-bold text-white/90">{initials}</span>
    </div>
  )

  const mobileAvatarElement = displayAvatarUrl ? (
    <img
      src={displayAvatarUrl}
      alt={`${firstName} ${lastName}`}
      className="w-8 h-8 rounded-full object-cover border border-white/20"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
      <span className="text-xs font-bold text-white/90">{initials}</span>
    </div>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full sidebar-inner">
      {/* Avatar & Identity */}
      <div className="px-6 pt-8 pb-5">
        {avatarElement}
        <h1 className="text-xl font-bold text-white mb-1 mt-4">
          {firstName} {lastName}
        </h1>
        {aboutContent && (
          <div className="text-sm text-white/60 leading-relaxed sidebar-rich-content">
            <RichContent html={aboutContent} />
          </div>
        )}
      </div>

      <div className="mx-6 border-t border-white/10" />

      {/* Contact buttons */}
      {contactButtons.length > 0 && (
        <div className="px-6 py-5 flex flex-col gap-2">
          {contactButtons.map((btn, idx) => (
            <a
              key={btn.id}
              href={btn.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 rounded-xl transition-colors text-sm ${
                idx === 0
                  ? 'py-3 bg-white/10 hover:bg-white/15 text-white font-medium'
                  : 'py-2.5 bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              {CONTACT_ICONS[btn.icon] || CONTACT_ICONS.link}
              {btn.label}
            </a>
          ))}
        </div>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                aria-label={link.platform}
              >
                {SOCIAL_ICONS[link.platform] || (
                  <span className="text-xs font-bold uppercase">{link.platform.charAt(0)}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section */}
      <div className="px-6 py-5 border-t border-white/10 mt-auto">
        <div className="flex items-center justify-between">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 text-xs"
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Светлая
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Темная
                </>
              )}
            </button>
          )}
          <Link
            href="/admin/login"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 sidebar-bg backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {mobileAvatarElement}
          <span className="text-sm font-semibold text-white">{firstName} {lastName}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Меню"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out */}
      <aside
        className={`lg:hidden fixed top-14 left-0 bottom-0 z-50 w-72 sidebar-bg border-r border-white/10 overflow-y-auto transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 xl:w-80 sidebar-bg border-r border-white/10 overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  )
}
