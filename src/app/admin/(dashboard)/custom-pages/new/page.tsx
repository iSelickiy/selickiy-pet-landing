import { prisma } from '@/lib/prisma'
import CustomPageForm from '@/components/admin/CustomPageForm'

export const dynamic = 'force-dynamic'

export default async function NewCustomPage() {
  const pages = await prisma.customPage.findMany({
    select: { folder: true, tags: true },
  })

  const folders = Array.from(
    new Set(pages.map((p) => p.folder).filter(Boolean))
  ).sort()

  const tags = Array.from(
    new Set(
      pages.flatMap((p) => {
        try {
          return JSON.parse(p.tags)
        } catch {
          return []
        }
      })
    )
  ).sort()

  return <CustomPageForm existingFolders={folders} existingTags={tags} />
}
