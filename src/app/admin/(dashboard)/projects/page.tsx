import { prisma } from '@/lib/prisma'
import ProjectList from '@/components/admin/ProjectList'
import { connection } from 'next/server'

export default async function ProjectsPage() {
  await connection()
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const parsed = projects.map((p) => ({
    ...p,
    techStack: JSON.parse(p.techStack) as string[],
  }))

  return <ProjectList initialProjects={parsed} />
}
