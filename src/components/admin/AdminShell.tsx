'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  ArrowSquareOut,
  Briefcase,
  FileHtml,
  FolderOpen,
  ImageSquare,
  List,
  SignOut,
  UserCircle,
  X,
} from '@phosphor-icons/react'

const items = [
  { href: '/admin/profile', label: 'Профиль', icon: UserCircle },
  { href: '/admin/resume', label: 'Резюме', icon: Briefcase },
  { href: '/admin/projects', label: 'Проекты', icon: FolderOpen },
  { href: '/admin/media', label: 'Медиа', icon: ImageSquare },
  { href: '/admin/custom-pages', label: 'Custom Pages', icon: FileHtml },
]

export default function AdminShell({ children, email }: { children: React.ReactNode; email?: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const nav = (
    <>
      <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin/profile" className="focus-ring rounded-lg text-base font-semibold text-white">selickiy.space</Link>
        <button type="button" onClick={() => setOpen(false)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-white lg:hidden" aria-label="Закрыть навигацию">
          <X size={22} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Разделы админки">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${active ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}>
              <Icon size={20} weight={active ? 'fill' : 'regular'} /> {label}
            </Link>
          )
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-4">
        {email && <p className="truncate px-2 text-xs text-white/35">{email}</p>}
        <a href="/" target="_blank" rel="noopener noreferrer" className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/65 hover:bg-white/8 hover:text-white">
          <ArrowSquareOut size={19} /> Открыть сайт
        </a>
        <button type="button" onClick={() => signOut({ callbackUrl: '/admin/login' })} className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/65 hover:bg-white/8 hover:text-white">
          <SignOut size={19} /> Выйти
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900">
      <aside className="sidebar-bg fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside className="sidebar-bg flex h-full w-[min(88vw,320px)] flex-col" onMouseDown={(event) => event.stopPropagation()}>{nav}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white/92 px-4 backdrop-blur-lg lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" aria-label="Открыть навигацию" aria-expanded={open}>
            <List size={22} />
          </button>
          <span className="font-semibold">Админка</span>
        </header>
        <main className="mx-auto min-h-screen max-w-[1280px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
