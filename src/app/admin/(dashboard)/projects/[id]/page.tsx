import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProjectForm from '@/components/admin/ProjectForm'

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  const parsed = {
    ...project,
    techStack: JSON.parse(project.techStack) as string[],
  }

  return <ProjectForm initialData={parsed} />
}
