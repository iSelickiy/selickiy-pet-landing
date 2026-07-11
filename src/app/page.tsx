import { ArrowDown, DotOutline } from '@phosphor-icons/react/dist/ssr'
import Sidebar from '@/components/public/Sidebar'
import Resume from '@/components/public/Resume'
import ProjectsGrid from '@/components/public/ProjectsGrid'
import Footer from '@/components/public/Footer'
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

      <main className="min-h-screen lg:ml-72">
        <nav className="public-tabs" aria-label="Навигация по странице">
          <a href="#about">Обо мне</a>
          <a href="#resume" className="active">Опыт</a>
          <a href="#projects">Проекты</a>
        </nav>

        <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pt-10">
          <header className="mb-9 hidden flex-col justify-between gap-5 border-b border-border-theme pb-7 sm:flex-row sm:items-end lg:flex">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <DotOutline size={26} weight="fill" className="text-accent" aria-hidden="true" />
                Привет! Рад видеть.
              </p>
              <h1 className="sr-only">{firstName} {lastName} — {tagline}</h1>
            </div>
            <a href="#resume" className="focus-ring inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-border-theme px-4 text-sm font-medium text-text-primary hover:border-accent/40 hover:text-accent sm:self-auto">
              Начать с опыта <ArrowDown size={17} />
            </a>
          </header>

          <div className="grid gap-12 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-14">
            <Resume experiences={data.experiences} skillsContent={data.content.skills ?? settings.skillsContent ?? ''} />
            <ProjectsGrid projects={data.projects} />
          </div>

          <Footer firstName={firstName} lastName={lastName} tagline={tagline} />
        </div>
      </main>
    </div>
  )
}
