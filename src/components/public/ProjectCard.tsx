import Image from 'next/image'
import Link from 'next/link'
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react/dist/ssr'

interface ProjectCardProps {
  title: string
  slug: string
  description: string
  previewUrl: string | null
  techStack: string[]
  stage: string
  cardType: string
  externalUrl: string | null
}

function stageTone(stage: string) {
  const value = stage.toLowerCase()
  if (/готов|жив|развива/.test(value)) return 'stage-live'
  if (/пау|архив|заброш/.test(value)) return 'stage-paused'
  if (/наброс|прототип/.test(value)) return 'stage-draft'
  return 'stage-progress'
}

export default function ProjectCard(project: ProjectCardProps) {
  const href = project.cardType === 'EXTERNAL_LINK' && project.externalUrl
    ? project.externalUrl
    : `/projects/${project.slug}`
  const external = href.startsWith('http')
  const content = (
    <>
      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-accent/6 sm:w-36">
        {project.previewUrl ? (
          <Image src={project.previewUrl} alt="" fill sizes="(max-width: 640px) 112px, 144px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-semibold text-accent/25" aria-hidden="true">
            {project.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-5 text-text-primary group-hover:text-accent">{project.title}</h3>
          {external ? <ArrowSquareOut size={19} className="shrink-0 text-text-secondary" /> : <GithubLogo size={19} className="shrink-0 text-text-secondary" />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-text-secondary">{project.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`project-stage ${stageTone(project.stage)}`}>{project.stage}</span>
          {project.techStack.slice(0, 3).map((tech) => (
            <span key={tech} className="tech-chip">{tech}</span>
          ))}
        </div>
      </div>
    </>
  )

  const className = 'project-row group focus-ring flex min-h-32 gap-4 rounded-xl py-4'
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
  ) : (
    <Link href={href} className={className}>{content}</Link>
  )
}
