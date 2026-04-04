import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold mb-6">Админ-панель</h2>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/profile"
            className="px-3 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Профиль
          </Link>
          <Link
            href="/admin/resume"
            className="px-3 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Резюме
          </Link>
          <Link
            href="/admin/projects"
            className="px-3 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Проекты
          </Link>
          <Link
            href="/admin/media"
            className="px-3 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Медиа
          </Link>
        </nav>
        <div className="mt-auto">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← На сайт
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50 min-h-screen">{children}</main>
    </div>
  )
}
