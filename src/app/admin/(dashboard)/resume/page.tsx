import { prisma } from '@/lib/prisma'
import ResumeEditor from '@/components/admin/ResumeEditor'
import PageHeader from '@/components/admin/PageHeader'
import { connection } from 'next/server'

export default async function ResumePage() {
  await connection()
  const experiences = await prisma.resumeExperience.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const skillsSection = await prisma.contentSection.findFirst({
    where: { key: 'skills' },
  })

  return (
    <div>
      <PageHeader title="Резюме" description="Хронология остаётся компактной на сайте, а подробности раскрываются по нажатию." />
      <ResumeEditor
        experiences={experiences}
        skillsContent={skillsSection?.content ?? ''}
      />
    </div>
  )
}
