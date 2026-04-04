import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteFile } from '@/lib/uploads'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { filename } = await params

  await deleteFile(filename)
  return NextResponse.json({ success: true })
}
