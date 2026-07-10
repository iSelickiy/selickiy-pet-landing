import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection()
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return (
    <AdminShell email={session.user?.email}>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-label="Загрузка раздела" />}>
        {children}
      </Suspense>
    </AdminShell>
  )
}
