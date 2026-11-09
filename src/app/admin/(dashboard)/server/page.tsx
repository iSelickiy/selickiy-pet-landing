import { Suspense } from 'react'
import { connection } from 'next/server'
import ServerAdmin from '@/components/admin/ServerAdmin'
import { ControlPlaneError, getServerOverview } from '@/lib/controlPlane'
import type { ServerOverview } from '@/lib/infrastructureTypes'

async function ServerContent() {
  await connection()
  let overview: ServerOverview | null = null
  let error: string | undefined
  try {
    overview = await getServerOverview()
  } catch (caught) {
    error = caught instanceof ControlPlaneError ? caught.message : 'Не удалось получить состояние сервера'
  }
  return <ServerAdmin initialOverview={overview} initialError={error} />
}

export default function ServerPage() {
  return <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-label="Загрузка состояния сервера" />}><ServerContent /></Suspense>
}
