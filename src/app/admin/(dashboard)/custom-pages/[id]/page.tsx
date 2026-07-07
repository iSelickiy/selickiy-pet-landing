import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeCustomPage } from '@/lib/customPages'
import CustomPageForm from '@/components/admin/CustomPageForm'

export const dynamic = 'force-dynamic'

export default async function EditCustomPagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [customPage, allPages] = await Promise.all([
    prisma.customPage.findUnique({ where: { id } }),
    prisma.customPage.findMany({
      select: { folder: true, tags: true },
    }),
  ])

  if (!customPage) notFound()

  const folders = Array.from(
    new Set(allPages.map((p) => p.folder).filter(Boolean))
  ).sort()

  const tags = Array.from(
    new Set(
      allPages.flatMap((p) => {
        try {
          return JSON.parse(p.tags)
        } catch {
          return []
        }
      })
    )
  ).sort()

  return (
    <CustomPageForm
      initialData={serializeCustomPage(customPage)}
      existingFolders={folders}
      existingTags={tags}
    />
  )
}
