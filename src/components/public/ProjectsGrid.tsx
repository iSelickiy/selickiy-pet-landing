'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowSquareOut, CircleNotch } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import ProjectCard from './ProjectCard'

interface ProjectsGridProps {
  projects: Array<{
    id: string
    title: string
    slug: string
    description: string
    previewUrl: string | null
    techStack: string[]
    stage: string
    cardType: string
    externalUrl: string | null
  }>
}

function projectWord(count: number) {
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 >= 11 && mod100 <= 14) return 'проектов'
  if (mod10 === 1) return 'проект'
  if (mod10 >= 2 && mod10 <= 4) return 'проекта'
  return 'проектов'
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [showAll, setShowAll] = useState(false)
  const featured = useMemo(() => {
    const priorities = [/sales pipeline/i, /чек.?лист.*лояльност/i, /crm roi/i]
    const picked = priorities
      .map((pattern) => projects.find((project) => pattern.test(project.title)))
      .filter((project): project is ProjectsGridProps['projects'][number] => Boolean(project))
    for (const project of projects) {
      if (picked.length === 3) break
      if (!picked.some(({ id }) => id === project.id)) picked.push(project)
    }
    return picked.slice(0, 3)
  }, [projects])
  const remaining = projects.filter((project) => !featured.some(({ id }) => id === project.id))

  const artFor = (title: string) => {
    if (/sales pipeline/i.test(title)) return '/project-art/sales-pipeline.jpg'
    if (/чек.?лист.*лояльност/i.test(title)) return '/project-art/loyalty-checklist.jpg'
    if (/crm roi/i.test(title)) return '/project-art/crm-roi.jpg'
    return null
  }

  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-8 border-b border-border-theme py-8 sm:py-9">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="projects-title" className="eyebrow flex items-center gap-2 text-text-primary">
          Сейчас собираю <CircleNotch size={15} className="text-text-secondary" aria-hidden="true" />
        </h2>
        {projects.length > featured.length && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-soft"
            aria-expanded={showAll}
            aria-controls="all-projects"
          >
            {showAll ? 'Свернуть' : `Все ${projects.length} ${projectWord(projects.length)}`} <ArrowRight size={16} className={showAll ? 'rotate-90' : ''} />
          </button>
        )}
      </div>
      {projects.length ? (
        <>
          <div className="featured-projects-grid">
            {featured.map((project) => {
              const href = project.cardType === 'EXTERNAL_LINK' && project.externalUrl
                ? project.externalUrl
                : `/projects/${project.slug}`
              const external = href.startsWith('http')
              const art = project.previewUrl || artFor(project.title)
              const card = (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-accent/6">
                    {art ? (
                      <Image src={art} alt="" fill sizes="(max-width: 767px) 38vw, 150px" loading="eager" className="object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-semibold text-accent/25" aria-hidden="true">{project.title.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0 py-1">
                    <h3 className="text-[15px] font-semibold leading-5 text-text-primary group-hover:text-accent">{project.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{project.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 3).map((tech) => <span key={tech} className="tech-chip">{tech}</span>)}
                    </div>
                  </div>
                  {external && <ArrowSquareOut size={16} className="absolute right-2 top-2 text-white/80 drop-shadow-sm" aria-hidden="true" />}
                </>
              )
              const className = 'group relative grid min-w-0 grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] items-start gap-3.5 rounded-xl focus-ring'
              return external ? (
                <a key={project.id} href={href} target="_blank" rel="noopener noreferrer" className={className}>{card}</a>
              ) : (
                <Link key={project.id} href={href} className={className}>{card}</Link>
              )
            })}
          </div>
          {showAll && remaining.length > 0 && (
            <div id="all-projects" className="mt-7 border-t border-border-theme pt-2">
              {remaining.map((project) => <ProjectCard key={project.id} {...project} />)}
            </div>
          )}
        </>
      ) : (
        <p className="empty-state">Проекты пока готовятся к публикации.</p>
      )}
    </section>
  )
}
