import { Suspense } from 'react'
import { connection } from 'next/server'
import ObsidianAdmin from '@/components/admin/ObsidianAdmin'
import { ControlPlaneError, getVaults } from '@/lib/controlPlane'
import type { VaultSummary } from '@/lib/infrastructureTypes'

async function ObsidianContent() {
  await connection()
  let vaults: VaultSummary[] = []
  let error: string | undefined
  try {
    vaults = await getVaults()
  } catch (caught) {
    error = caught instanceof ControlPlaneError ? caught.message : 'Не удалось получить vault’ы'
  }
  return <ObsidianAdmin initialVaults={vaults} initialError={error} />
}

export default function ObsidianPage() {
  return <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-label="Загрузка vault’ов" />}><ObsidianContent /></Suspense>
}
