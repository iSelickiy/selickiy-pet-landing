'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { GoogleLogo, LockKey, ArrowLeft } from '@phosphor-icons/react'
import Link from 'next/link'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <main className="sidebar-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <Link href="/" className="focus-ring mb-6 inline-flex min-h-11 items-center gap-2 self-start rounded-xl text-sm text-white/65 hover:text-white"><ArrowLeft size={18} /> На сайт</Link>
        <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><LockKey size={25} /></div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Вход в админку</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Управление резюме, проектами и личной лабораторией.</p>

        {error && (
          <div role="alert" className="mt-5 w-full rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === 'AccessDenied'
              ? 'Доступ запрещён. Ваш аккаунт не в списке администраторов.'
              : 'Ошибка авторизации. Попробуйте снова.'}
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl: '/admin/profile' })}
          className="focus-ring mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <GoogleLogo size={21} weight="bold" /> Войти через Google
        </button>

        <p className="mt-5 text-xs text-slate-400">
          Доступ только для администраторов
        </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="sidebar-bg flex min-h-screen items-center justify-center">
        <div className="text-white/65">Загрузка…</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
