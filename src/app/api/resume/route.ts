import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const experiences = await prisma.resumeExperience.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(experiences)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { company, position, periodFrom, periodTo, description } = await request.json()

  if (!company || !position || !periodFrom || !periodTo) {
    return NextResponse.json(
      { error: 'company, position, periodFrom, and periodTo are required' },
      { status: 400 }
    )
  }

  const experience = await prisma.resumeExperience.create({
    data: { company, position, periodFrom, periodTo, description: description ?? '' },
  })

  revalidatePath('/')
  return NextResponse.json(experience)
}
