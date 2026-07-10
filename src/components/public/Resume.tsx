import { CaretDown } from '@phosphor-icons/react/dist/ssr'
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
    <section id="resume" aria-labelledby="resume-title" className="scroll-mt-28">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Опыт и путь</p>
          <h2 id="resume-title">Резюме</h2>
        </div>
        <span className="text-sm text-text-secondary">Нажми, чтобы раскрыть</span>
      </div>

      {experiences.length ? (
        <div className="resume-timeline">
          {experiences.map((experience, index) => (
            <details key={experience.id || `${experience.company}-${index}`} className="resume-entry group" open={index === 0}>
              <summary className="focus-ring grid cursor-pointer list-none grid-cols-[88px_1fr_auto] gap-3 rounded-xl px-2 py-4 sm:grid-cols-[112px_1fr_auto]">
                <span className="text-sm leading-5 text-text-secondary">
                  {experience.periodFrom}<br className="sm:hidden" /> — {experience.periodTo}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-5 text-text-primary">{experience.position}</span>
                  <span className="mt-1 block text-sm text-accent">{experience.company}</span>
                </span>
                <CaretDown size={18} className="mt-1 text-text-secondary transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              {experience.description && (
                <div className="pb-5 pl-[103px] pr-8 sm:pl-[127px]">
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
          <summary className="focus-ring cursor-pointer rounded-lg py-2 text-sm font-medium text-accent">Навыки и инструменты</summary>
          <RichContent html={skillsContent} className="mt-3 text-sm" />
        </details>
      )}
    </section>
  )
}
