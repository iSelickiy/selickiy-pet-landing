import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CustomPageForm from '@/components/admin/CustomPageForm'

export default async function EditCustomPagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const customPage = await prisma.customPage.findUnique({ where: { id } })
  if (!customPage) notFound()

  return <CustomPageForm initialData={customPage} />
}
