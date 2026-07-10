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

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-28">
      <div className="section-heading">
        <div>
          <p className="eyebrow">То, что я собираю</p>
          <h2 id="projects-title">Pet‑проекты</h2>
        </div>
        <span className="text-sm text-text-secondary">{projects.length} шт.</span>
      </div>
      {projects.length ? (
        <div className="divide-y divide-border-theme">
          {projects.map((project) => <ProjectCard key={project.id} {...project} />)}
        </div>
      ) : (
        <p className="empty-state">Проекты пока готовятся к публикации.</p>
      )}
    </section>
  )
}
