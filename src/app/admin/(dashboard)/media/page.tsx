import { prisma } from '@/lib/prisma'
import MediaLibrary from '@/components/admin/MediaLibrary'
import { connection } from 'next/server'

export default async function MediaPage() {
  await connection()
  const files = await prisma.mediaFile.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <MediaLibrary initialFiles={JSON.parse(JSON.stringify(files))} />
}
