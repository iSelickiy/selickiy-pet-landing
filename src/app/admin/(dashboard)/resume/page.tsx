import { prisma } from '@/lib/prisma'
import ResumeEditor from '@/components/admin/ResumeEditor'

export default async function ResumePage() {
  const experiences = await prisma.resumeExperience.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const skillsSection = await prisma.contentSection.findFirst({
    where: { key: 'skills' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Резюме</h1>
      <ResumeEditor
        experiences={experiences}
        skillsContent={skillsSection?.content ?? ''}
      />
    </div>
  )
}
