import Link from 'next/link'

interface ProjectCardProps {
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

function CardContent({ title, description, previewUrl, techStack }: Pick<ProjectCardProps, 'title' | 'description' | 'previewUrl' | 'techStack'>) {
  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-t-2xl">
        {previewUrl ? (
          <img src={previewUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-transparent flex items-center justify-center">
            <span className="text-4xl font-bold text-accent/30">{title.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-4 line-clamp-3">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ProjectCard(props: ProjectCardProps) {
  const { title, slug, description, previewUrl, techStack, cardType, externalUrl } = props

  const cardClasses = "group bg-card-bg rounded-2xl border border-border-theme shadow-sm hover:shadow-md hover:border-text-secondary/20 transition-all duration-200 overflow-hidden"

  if (cardType === 'EXTERNAL_LINK' && externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className={cardClasses}>
        <CardContent title={title} description={description} previewUrl={previewUrl} techStack={techStack} />
      </a>
    )
  }

  return (
    <Link href={`/projects/${slug}`} className={cardClasses}>
      <CardContent title={title} description={description} previewUrl={previewUrl} techStack={techStack} />
    </Link>
  )
}
