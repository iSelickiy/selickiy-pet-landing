import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { readCustomPageFile } from '@/lib/customPageStorage'

export const dynamic = 'force-dynamic'

interface CustomPageRouteProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params

  const customPage = await prisma.customPage.findUnique({
    where: { slug },
    select: { title: true, status: true },
  })

  if (!customPage || customPage.status === 'DRAFT') {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: customPage.title,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function CustomPageRoute({ params }: CustomPageRouteProps) {
  const { slug } = await params

  const customPage = await prisma.customPage.findUnique({ where: { slug } })
  if (!customPage || customPage.status === 'DRAFT') {
    notFound()
  }

  const html = await readCustomPageFile(customPage.storedFile)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-gray-900">{customPage.title}</p>
          <p className="text-xs text-gray-500">
            Изолированный режим просмотра. Страница скрыта от индексации.
          </p>
        </div>

        <iframe
          title={customPage.title}
          sandbox="allow-scripts"
          srcDoc={html}
          className="h-[calc(100vh-9rem)] w-full rounded-xl border border-gray-200 bg-white shadow-sm"
        />
      </div>
    </div>
  )
}
