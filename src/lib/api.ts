import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ZodError, type ZodType } from 'zod'
import { authOptions } from '@/lib/auth'

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'INTERNAL_ERROR'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  )
}

export async function requireAdmin() {
  return Boolean(await getServerSession(authOptions))
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ZodError([{
      code: 'custom',
      path: [],
      message: 'Request body must be valid JSON',
      input: undefined,
    }])
  }
  return schema.parse(body)
}

export function validationError(error: ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    fields[issue.path.join('.') || 'body'] = issue.message
  }
  return apiError(400, 'VALIDATION_ERROR', 'Проверьте заполненные поля', fields)
}

export function unknownApiError(error: unknown, fallback = 'Не удалось выполнить запрос') {
  if (error instanceof ZodError) return validationError(error)
  console.error(error)
  return apiError(500, 'INTERNAL_ERROR', fallback)
}
