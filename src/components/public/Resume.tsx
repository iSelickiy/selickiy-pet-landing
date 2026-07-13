import { Briefcase, CaretDown } from '@phosphor-icons/react/dist/ssr'
import RichContent from '@/components/ui/RichContent'

interface ResumeProps {
  experiences: Array<{
    id?: string
    company: string
    position: string
    periodFrom: string
    periodTo: string
    description: string
  }>
  skillsContent?: string
}

export default function Resume({ experiences, skillsContent = '' }: ResumeProps) {
  return (
    <section id="resume" aria-labelledby="resume-title" className="scroll-mt-8 py-8 sm:py-9">
      <div className="mb-4 flex items-center gap-2">
        <Briefcase size={16} className="text-text-secondary" aria-hidden="true" />
        <h2 id="resume-title" className="eyebrow text-text-primary">Опыт</h2>
      </div>

      {experiences.length ? (
        <div className="resume-timeline">
          {experiences.map((experience, index) => (
            <details key={experience.id || `${experience.company}-${index}`} className="resume-entry group" open={index === 0}>
              <summary className="focus-ring grid cursor-pointer list-none grid-cols-[112px_1fr_auto] gap-4 rounded-xl px-2 py-4 sm:grid-cols-[145px_1fr_auto] sm:px-3">
                <span className="text-sm leading-5 text-text-secondary">
                  {experience.periodFrom} —<br />{experience.periodTo}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-5 text-text-primary sm:text-base">{experience.position} <span className="font-normal text-text-secondary">—</span> <span className="font-medium text-accent">{experience.company}</span></span>
                </span>
                <CaretDown size={18} className="mt-1 text-text-secondary transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              {experience.description && (
                <div className="pb-5 pl-[132px] pr-8 sm:pl-[168px]">
                  <RichContent html={experience.description} className="text-sm" />
                </div>
              )}
            </details>
          ))}
        </div>
      ) : (
        <p className="empty-state">Хронология скоро появится.</p>
      )}

      {skillsContent && (
        <details className="mt-5 border-t border-border-theme pt-4">
          <summary className="focus-ring cursor-pointer rounded-lg py-2 text-sm font-medium text-accent">Посмотреть навыки и инструменты</summary>
          <RichContent html={skillsContent} className="mt-3 text-sm" />
        </details>
      )}
    </section>
  )
}
