import { prisma } from '@/lib/prisma'
import MediaLibrary from '@/components/admin/MediaLibrary'

export default async function MediaPage() {
  const files = await prisma.mediaFile.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <MediaLibrary initialFiles={JSON.parse(JSON.stringify(files))} />
}
