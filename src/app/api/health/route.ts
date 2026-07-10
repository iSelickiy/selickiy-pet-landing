import { NextResponse } from 'next/server'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  await connection()
  let database: 'ok' | 'error' = 'ok'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    database = 'error'
    console.error('Health check database failure', error)
  }

  const status = database === 'ok' ? 'ok' : 'degraded'
  return NextResponse.json(
    {
      status,
      database,
      commit: process.env.APP_GIT_SHA || 'unknown',
      builtAt: process.env.APP_BUILT_AT || 'unknown',
    },
    {
      status: database === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
