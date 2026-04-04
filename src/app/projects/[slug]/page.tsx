import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RichContent from '@/components/ui/RichContent'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  const project = await prisma.project.findUnique({
    where: { slug },
  })

  if (!project || project.status === 'DRAFT') {
    notFound()
  }

  const techStack = JSON.parse(project.techStack) as string[]

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Назад к проектам
        </Link>

        <h1 className="text-4xl font-bold text-text-primary mb-6">{project.title}</h1>

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-sm font-medium rounded-full bg-accent/10 text-accent"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.externalUrl && (
          <a
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity mb-10"
          >
            Открыть проект
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {project.pageContent && (
          <div className="bg-card-bg rounded-2xl border border-border-theme p-8 md:p-10 shadow-sm">
            <RichContent html={project.pageContent} />
          </div>
        )}
      </div>
    </div>
  )
}
