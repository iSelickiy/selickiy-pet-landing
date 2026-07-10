import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { getPublishedCustomPage, getPublishedCustomPageDocument } from '@/lib/publicData'

interface CustomPageRouteProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params
  const customPage = await getPublishedCustomPage(slug)
  return {
    title: customPage?.title || 'Страница не найдена',
    robots: { index: false, follow: false },
  }
}

export default function CustomPageRoute({ params }: CustomPageRouteProps) {
  return <Suspense fallback={<main className="fixed inset-0 bg-white" aria-label="Загрузка страницы" />}><CustomPageContent params={params} /></Suspense>
}

async function CustomPageContent({ params }: CustomPageRouteProps) {
  await connection()
  const { slug } = await params
  const document = await getPublishedCustomPageDocument(slug)
  if (!document) notFound()
  return (
    <iframe
      title={document.page.title}
      sandbox="allow-scripts allow-forms allow-popups"
      referrerPolicy="no-referrer"
      srcDoc={document.html}
      className="fixed inset-0 h-full w-full border-0 bg-white"
    />
  )
}
