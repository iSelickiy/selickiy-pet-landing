import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import RichContent from '@/components/ui/RichContent'
import { getPublishedProject } from '@/lib/publicData'

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<main className="min-h-screen bg-bg-primary" aria-label="Загрузка проекта" />}><ProjectContent params={params} /></Suspense>
}

async function ProjectContent({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const { slug } = await params
  const project = await getPublishedProject(slug)
  if (!project) notFound()

  return (
    <main className="min-h-screen bg-bg-primary">
      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
        <Link href="/#projects" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl text-sm text-text-secondary hover:text-accent">
          <ArrowLeft size={18} /> Назад к проектам
        </Link>
        {project.previewUrl && (
          <div className="relative mt-7 aspect-video overflow-hidden rounded-2xl border border-border-theme bg-card-bg">
            <Image src={project.previewUrl} alt="" fill sizes="(max-width: 768px) 100vw, 768px" priority className="object-cover" />
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="project-stage stage-progress">{project.stage}</span>
          {project.techStack.map((tech) => <span key={tech} className="tech-chip">{tech}</span>)}
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg leading-8 text-text-secondary">{project.description}</p>
        {project.externalUrl && (
          <a href={project.externalUrl} target="_blank" rel="noopener noreferrer" className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:opacity-90">
            Открыть проект <ArrowSquareOut size={18} />
          </a>
        )}
        {project.pageContent && (
          <div className="mt-10 border-t border-border-theme pt-8">
            <RichContent html={project.pageContent} />
          </div>
        )}
      </article>
    </main>
  )
}
