import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, requireAdmin, unknownApiError } from '@/lib/api'
import { MAX_UPLOAD_BYTES, saveFile } from '@/lib/uploads'

export async function GET() {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  return NextResponse.json(await prisma.mediaFile.findMany({ orderBy: { createdAt: 'desc' } }))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return apiError(401, 'UNAUTHORIZED', 'Требуется авторизация')
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_UPLOAD_BYTES + 1_000_000) {
      return apiError(413, 'PAYLOAD_TOO_LARGE', 'Файл слишком большой')
    }
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return apiError(400, 'VALIDATION_ERROR', 'Выберите файл', { file: 'Файл обязателен' })
    const result = await saveFile(file)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error && /Only JPEG|Image must/.test(error.message)) {
      return apiError(415, 'UNSUPPORTED_MEDIA_TYPE', error.message, { file: error.message })
    }
    return unknownApiError(error, 'Не удалось загрузить файл')
  }
}
