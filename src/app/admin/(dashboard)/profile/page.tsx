import { prisma } from '@/lib/prisma'
import ProfileEditor from '@/components/admin/ProfileEditor'

export default async function ProfilePage() {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h1>
      <ProfileEditor
        settings={settingsMap}
        contactButtons={contactButtons}
        socialLinks={socialLinks}
      />
    </div>
  )
}
