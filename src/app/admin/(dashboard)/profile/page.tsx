import { prisma } from '@/lib/prisma'
import ProfileEditor from '@/components/admin/ProfileEditor'
import PageHeader from '@/components/admin/PageHeader'
import { connection } from 'next/server'

export default async function ProfilePage() {
  await connection()
  const settings = await prisma.siteSetting.findMany()
  const contactButtons = await prisma.contactButton.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  const socialLinks = await prisma.socialLink.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const settingsMap: Record<string, string> = {}
  for (const s of settings) {
    settingsMap[s.key] = s.value
  }

  return (
    <div>
      <PageHeader title="Профиль" description="Имя, позиционирование, контакты и то, как ты выглядишь на публичной странице." />
      <ProfileEditor
        settings={settingsMap}
        contactButtons={contactButtons}
        socialLinks={socialLinks}
      />
    </div>
  )
}
