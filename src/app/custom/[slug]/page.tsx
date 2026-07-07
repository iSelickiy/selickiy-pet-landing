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
    <iframe
      title={customPage.title}
      sandbox="allow-scripts"
      srcDoc={html}
      className="fixed inset-0 h-full w-full border-0"
    />
  )
}
