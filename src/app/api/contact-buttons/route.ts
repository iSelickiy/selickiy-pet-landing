import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const buttons = await prisma.contactButton.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(buttons)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { label, url, icon } = await request.json()

  if (!label || !url) {
    return NextResponse.json({ error: 'label and url are required' }, { status: 400 })
  }

  const button = await prisma.contactButton.create({
    data: { label, url, icon: icon ?? 'calendar' },
  })

  revalidatePath('/')
  return NextResponse.json(button)
}
