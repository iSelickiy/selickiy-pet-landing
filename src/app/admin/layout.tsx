import { Suspense } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<main className="sidebar-bg flex min-h-screen items-center justify-center text-white/65">Загрузка админки…</main>}>
      {children}
    </Suspense>
  )
}
