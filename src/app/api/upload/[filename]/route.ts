import { NextResponse } from 'next/server'
import { apiError, requireAdmin, unknownApiError } from '@/lib/api'
import { deleteFile } from '@/lib/uploads'

export async function DELETE(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const { filename } = await params
    const deleted = await deleteFile(filename)
    if (!deleted) return apiError(404, 'NOT_FOUND', 'Файл не найден')
    return NextResponse.json({ success: true })
  } catch (error) {
    return unknownApiError(error, 'Не удалось удалить файл')
  }
}
