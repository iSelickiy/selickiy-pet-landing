import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProjectForm from '@/components/admin/ProjectForm'
import { connection } from 'next/server'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  const parsed = {
    ...project,
    techStack: JSON.parse(project.techStack) as string[],
  }

  return <ProjectForm initialData={parsed} />
}
