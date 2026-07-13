import Sidebar from '@/components/public/Sidebar'
import Resume from '@/components/public/Resume'
import ProjectsGrid from '@/components/public/ProjectsGrid'
import Footer from '@/components/public/Footer'
import RichContent from '@/components/ui/RichContent'
import { getPortfolioData } from '@/lib/publicData'

const defaultIntro = 'Развиваю продажи, запускаю новые направления и иногда собираю веб‑проекты просто потому, что могу.'

export default async function Home() {
  const data = await getPortfolioData().catch((error) => {
    console.error('Failed to load public portfolio data', error)
    return {
      settings: {} as Record<string, string>,
      content: {} as Record<string, string>,
      socialLinks: [],
      projects: [],
      experiences: [],
    }
  })
  const settings = data.settings
  const firstName = settings.firstName || 'Игорь'
  const lastName = settings.lastName || 'Селицкий'
  const tagline = settings.tagline || 'Биздев — техноэнтузиаст'
  const intro = settings.introText || defaultIntro

  return (
    <div id="about" className="min-h-screen">
      <a href="#resume" className="skip-link">Перейти к резюме</a>
      <Sidebar
        firstName={firstName}
        lastName={lastName}
        avatarUrl={settings.avatarStatic || settings.avatarLight || settings.avatarUrl || null}
        avatarDarkUrl={settings.avatarDark || settings.avatarDarkUrl || null}
        avatarMode={(settings.avatarMode as 'static' | 'dynamic') || 'static'}
        tagline={tagline}
        intro={intro}
        socialLinks={data.socialLinks}
      />

      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto max-w-[1180px] px-5 pb-8 pt-9 sm:px-8 lg:px-12 lg:pt-14">
          <header className="hero-intro relative border-b border-border-theme pb-8 sm:pb-10">
            <p className="eyebrow">Привет!</p>
            <h1 className="mt-1 text-[clamp(2.65rem,5.5vw,4.5rem)] font-bold leading-[.98] tracking-[-.055em] text-text-primary">
              Рад видеть<span className="text-accent">.</span>
            </h1>
            <div className="mt-5 max-w-[570px] text-[15px] leading-7 text-text-secondary">
              {settings.aboutContent ? (
                <RichContent html={settings.aboutContent} />
              ) : (
                <p>Мне интересно находить точки роста, упрощать сложные вещи и доводить до результата. Здесь — мой опыт и проекты, которые собираю для себя и в удовольствие.</p>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-text-secondary first-letter:uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Сегодня · Москва · UTC+3
            </p>
            <p className="hero-note hidden xl:block" aria-hidden="true">Код пишу, идеи тестирую,<br />кофе не заканчивается →</p>
          </header>

          <ProjectsGrid projects={data.projects} />
          <Resume experiences={data.experiences} skillsContent={data.content.skills ?? settings.skillsContent ?? ''} />

          <Footer firstName={firstName} lastName={lastName} tagline={tagline} />
        </div>
      </main>
    </div>
  )
}
