import { prisma } from '@/lib/prisma'
import { serializeCustomPage } from '@/lib/customPages'
import CustomPageList from '@/components/admin/CustomPageList'

export const dynamic = 'force-dynamic'

export default async function CustomPagesPage() {
  const customPages = await prisma.customPage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <CustomPageList initialPages={customPages.map(serializeCustomPage)} />
}
