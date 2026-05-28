import { prisma } from '@/lib/prisma'
import ProjectList from '@/components/admin/ProjectList'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const parsed = projects.map((p) => ({
    ...p,
    techStack: JSON.parse(p.techStack) as string[],
  }))

  return <ProjectList initialProjects={parsed} />
}
