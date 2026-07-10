import { prisma } from '@/lib/prisma'
import { serializeCustomPage } from '@/lib/customPages'
import CustomPageList from '@/components/admin/CustomPageList'
import { connection } from 'next/server'

export default async function CustomPagesPage() {
  await connection()
  const customPages = await prisma.customPage.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <CustomPageList initialPages={customPages.map(serializeCustomPage)} />
}
