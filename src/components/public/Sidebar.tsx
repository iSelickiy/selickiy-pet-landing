'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import {
  Archive,
  Briefcase,
  Code,
  EnvelopeSimple,
  Flask,
  GithubLogo,
  House,
  InstagramLogo,
  LinkedinLogo,
  List,
  Moon,
  PaperPlaneTilt,
  Sun,
  X,
} from '@phosphor-icons/react'
import { useIsMounted } from '@/lib/useIsMounted'

interface SidebarProps {
  firstName: string
  lastName: string
  avatarUrl: string | null
  avatarDarkUrl: string | null
  avatarMode: 'static' | 'dynamic'
  tagline: string
  intro: string
  socialLinks: Array<{ platform: string; url: string }>
}

const navItems = [
  { href: '#about', label: 'Обо мне', icon: House },
  { href: '#resume', label: 'Опыт', icon: Briefcase },
  { href: '#projects', label: 'Проекты', icon: Code },
  { href: '#laboratory', label: 'Лаборатория', icon: Flask },
]

function normalizeHref(platform: string, value: string) {
  if (platform === 'email' && !value.startsWith('mailto:')) return `mailto:${value}`
  return value
}

function SocialIcon({ platform }: { platform: string }) {
  const props = { size: 19, weight: 'regular' as const }
  if (platform === 'telegram') return <PaperPlaneTilt {...props} />
  if (platform === 'email') return <EnvelopeSimple {...props} />
  if (platform === 'github') return <GithubLogo {...props} />
  if (platform === 'linkedin') return <LinkedinLogo {...props} />
  if (platform === 'instagram') return <InstagramLogo {...props} />
  return <Archive {...props} />
}

export default function Sidebar(props: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()
  const [menuOpen, setMenuOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isDark = mounted && theme === 'dark'
  const avatarUrl = props.avatarMode === 'dynamic' && isDark && props.avatarDarkUrl
    ? props.avatarDarkUrl
    : props.avatarUrl

  useEffect(() => {
    if (!menuOpen) return
    const trigger = triggerRef.current
    const main = document.querySelector('main')
    main?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])')
    focusable?.[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      main?.removeAttribute('inert')
      document.body.style.overflow = ''
      trigger?.focus()
    }
  }, [menuOpen])

  const identity = (
    <>
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/20 bg-white/5">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={`${props.firstName} ${props.lastName}`} fill sizes="80px" priority className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/80" aria-hidden="true">
            {props.firstName.charAt(0)}{props.lastName.charAt(0)}
          </div>
        )}
      </div>
      <div>
        <p className="text-xl font-bold tracking-tight text-white">{props.firstName} {props.lastName}</p>
        <p className="mt-0.5 text-sm text-blue-300">{props.tagline}</p>
      </div>
    </>
  )

  const themeButton = (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="focus-ring flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {isDark ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  )

  return (
    <>
      <aside className="sidebar-bg fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 px-7 py-8 lg:flex">
        <div className="flex items-center gap-4">{identity}</div>
        <p className="mt-5 text-sm leading-6 text-white/62">{props.intro}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
          На связи
        </div>

        <nav className="mt-8 border-t border-white/10 pt-5" aria-label="Разделы страницы">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a href={href} className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/72 hover:bg-white/8 hover:text-white">
                  <Icon size={19} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-white/35">Контакты</p>
          <div className="flex flex-wrap gap-2">
            {props.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={normalizeHref(link.platform, link.url)}
                target={link.platform === 'email' ? undefined : '_blank'}
                rel={link.platform === 'email' ? undefined : 'noopener noreferrer'}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
                aria-label={link.platform}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            {mounted && themeButton}
            <Link href="/admin/login" className="focus-ring rounded-lg px-2 py-2 text-xs text-white/30 hover:text-white/65">Войти</Link>
          </div>
        </div>
      </aside>

      <header className="sidebar-bg px-5 pb-5 pt-6 text-white lg:hidden">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <List size={23} />
          </button>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">{props.intro}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" /> На связи
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 p-4 backdrop-blur-sm lg:hidden" onMouseDown={() => setMenuOpen(false)}>
          <div
            ref={dialogRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Навигация"
            className="sidebar-bg ml-auto flex h-full w-[min(90vw,340px)] flex-col rounded-2xl border border-white/10 p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Навигация</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-white" aria-label="Закрыть меню">
                <X size={22} />
              </button>
            </div>
            <nav className="mt-5" aria-label="Мобильная навигация">
              {navItems.map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="focus-ring flex min-h-12 items-center gap-3 rounded-xl px-3 text-white/75 hover:bg-white/10 hover:text-white">
                  <Icon size={20} /> {label}
                </a>
              ))}
            </nav>
            <div className="mt-auto space-y-4 border-t border-white/10 pt-5">
              <div className="flex gap-2">
                {props.socialLinks.map((link) => (
                  <a key={link.platform} href={normalizeHref(link.platform, link.url)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70" aria-label={link.platform}>
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
              {mounted && themeButton}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
