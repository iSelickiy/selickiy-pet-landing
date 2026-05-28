import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/public/Sidebar'
import Resume from '@/components/public/Resume'
import ProjectsGrid from '@/components/public/ProjectsGrid'
import Footer from '@/components/public/Footer'

export const dynamic = 'force-dynamic'

type ContentSectionRow = { key: string; content: string }
type ProjectRow = {
  id: string
  title: string
  slug: string
  description: string
  previewUrl: string | null
  techStack: string
  status: string
  cardType: string
  externalUrl: string | null
}
type SettingRow = { key: string; value: string }
type ContactButtonRow = { id: string; label: string; url: string; icon: string }
type SocialLinkRow = { platform: string; url: string }
type ExperienceRow = {
  company: string
  position: string
  periodFrom: string
  periodTo: string
  description: string
}

export default async function Home() {
  let sections: ContentSectionRow[] = []
  let projects: ProjectRow[] = []
  let settingsRows: SettingRow[] = []
  let contactButtons: ContactButtonRow[] = []
  let socialLinks: SocialLinkRow[] = []
  let experiences: ExperienceRow[] = []

  try {
    ;[sections, projects, settingsRows, contactButtons, socialLinks, experiences] = await Promise.all([
      prisma.contentSection.findMany(),
      prisma.project.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.siteSetting.findMany(),
      prisma.contactButton.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.resumeExperience.findMany({ orderBy: { sortOrder: 'asc' } }),
    ])
  } catch (error) {
    console.error('Failed to load public portfolio data', error)
  }

  const settings = Object.fromEntries(settingsRows.map(s => [s.key, s.value]))

  const contentMap = Object.fromEntries(
    sections.map((s) => [s.key, s.content])
  )

  const parsedProjects = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    previewUrl: p.previewUrl,
    techStack: JSON.parse(p.techStack) as string[],
    status: p.status,
    cardType: p.cardType,
    externalUrl: p.externalUrl,
  }))

  const parsedExperiences = experiences.map((e) => ({
    company: e.company,
    position: e.position,
    periodFrom: e.periodFrom,
    periodTo: e.periodTo,
    description: e.description,
  }))

  return (
    <div className="min-h-screen">
      <Sidebar
        firstName={settings.firstName || ''}
        lastName={settings.lastName || ''}
        avatarUrl={settings.avatarStatic || settings.avatarLight || settings.avatarUrl || null}
        avatarMode={(settings.avatarMode as 'static' | 'dynamic') || 'static'}
        avatarDarkUrl={settings.avatarDark || settings.avatarDarkUrl || null}
        aboutContent={settings.aboutContent || ''}
        contactButtons={contactButtons}
        socialLinks={socialLinks}
      />

      {/* Main content area -- offset for sidebar on desktop, offset for header on mobile */}
      <main className="lg:ml-72 xl:ml-80 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:py-16">
          {/* Projects first */}
          <ProjectsGrid projects={parsedProjects} />

          {/* Resume second */}
          <div className="mt-16">
            <Resume
              experiences={parsedExperiences}
              skillsContent={contentMap.skills ?? settings.skillsContent ?? ''}
            />
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}
