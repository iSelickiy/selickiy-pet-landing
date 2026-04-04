import ProjectCard from './ProjectCard'

interface Project {
  id: string
  title: string
  slug: string
  description: string
  previewUrl: string | null
  techStack: string[]
  status: string
  cardType: string
  externalUrl: string | null
}

interface ProjectsGridProps {
  projects: Project[]
}

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <section id="projects">
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-10">Проекты</h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-12">
            Проекты скоро появятся
          </p>
        )}
      </div>
    </section>
  )
}
