import { connection, NextResponse } from 'next/server'
import { readUpload } from '@/lib/uploads'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  await connection()
  const { filename } = await params
  try {
    const upload = await readUpload(filename)
    if (!upload) return new NextResponse('Not found', { status: 404 })
    return new NextResponse(new Uint8Array(upload.buffer), {
      headers: {
        'Content-Type': upload.record.mimeType,
        'Content-Length': String(upload.record.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    if (code === 'ENOENT') return new NextResponse('Not found', { status: 404 })
    console.error('Failed to read upload', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
