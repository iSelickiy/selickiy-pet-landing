import RichContent from '@/components/ui/RichContent'

interface ResumeProps {
  experiences: Array<{
    company: string
    position: string
    periodFrom: string
    periodTo: string
    description: string
  }>
  skillsContent: string
}

export default function Resume({ experiences, skillsContent }: ResumeProps) {
  return (
    <section id="resume">
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-8">Резюме</h2>

        {experiences.length > 0 && (
          <div className="space-y-4 mb-8">
            {experiences.map((exp, i) => (
              <div
                key={i}
                className="bg-card-bg rounded-2xl border border-border-theme p-6 md:p-8 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {exp.position}
                    </h3>
                    <p className="text-sm text-text-secondary font-medium">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-sm text-text-secondary whitespace-nowrap">
                    {exp.periodFrom} — {exp.periodTo}
                  </span>
                </div>
                {exp.description && (
                  <div className="text-sm text-text-secondary leading-relaxed">
                    <RichContent html={exp.description} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {skillsContent && (
          <div className="bg-card-bg rounded-2xl border border-border-theme p-8 md:p-10 shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Навыки</h3>
            <RichContent html={skillsContent} />
          </div>
        )}
      </div>
    </section>
  )
}
