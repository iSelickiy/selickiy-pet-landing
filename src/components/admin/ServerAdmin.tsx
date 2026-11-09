'use client'

import { useState } from 'react'
import { ArrowClockwise, Play, Stop } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError } from '@/lib/clientApi'
import type { ContainerAction, ServerOverview, ServiceSummary } from '@/lib/infrastructureTypes'

const protectedContainers = new Set(['bigvps-control', 'obsidian-couchdb', 'selickiy-landing-app-1', 'selickiy-landing-db-1', 'selickiy-landing-migrate-1', 'traefik'])

function formatBytes(bytes: number) {
  const value = bytes / 1024 ** 3
  return `${value.toFixed(1)} ГБ`
}

function Resource({ label, used, total }: { label: string; used: number; total: number }) {
  const percent = total ? Math.min(100, Math.round(used / total * 100)) : 0
  return (
    <div className="admin-card">
      <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{percent}%</p></div><p className="text-right text-xs leading-5 text-slate-500">{formatBytes(used)} из<br />{formatBytes(total)}</p></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${label}: ${percent}%`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${percent >= 85 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

export default function ServerAdmin({ initialOverview, initialError }: { initialOverview: ServerOverview | null; initialError?: string }) {
  const [overview, setOverview] = useState(initialOverview)
  const [error, setError] = useState(initialError || null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [pending, setPending] = useState<{ service: ServiceSummary; action: 'stop' | 'restart' } | null>(null)

  const refresh = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/admin/server', { cache: 'no-store' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось обновить сервер'))
      setOverview(await response.json() as ServerOverview)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось обновить сервер')
    } finally {
      setBusy(false)
    }
  }

  const execute = async (service: ServiceSummary, action: ContainerAction) => {
    setActionBusy(`${service.name}:${action}`)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/containers/${encodeURIComponent(service.name)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      if (!response.ok) throw new Error(await readApiError(response, 'Действие не выполнено'))
      setNotice(`${service.name}: ${action} выполнен`)
      setPending(null)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Действие не выполнено')
    } finally {
      setActionBusy(null)
    }
  }

  return (
    <div>
      <PageHeader title="Сервер" description="BIGVPS · 103.228.169.198. Критичные сервисы защищены от остановки через интерфейс." action={<Button type="button" variant="secondary" onClick={() => void refresh()} disabled={busy}><ArrowClockwise size={18} className={busy ? 'animate-spin' : ''} /> Обновить</Button>} />
      <StatusMessage message={error} tone="error" />
      <StatusMessage message={notice} tone="success" />
      {overview && <>
        <div className="grid gap-4 sm:grid-cols-2"><Resource label="Память" used={overview.resources.memory.used} total={overview.resources.memory.total} /><Resource label="Диск" used={overview.resources.disk.used} total={overview.resources.disk.total} /></div>
        <section className="mt-6" aria-labelledby="services-title">
          <h2 id="services-title" className="mb-3 text-sm font-semibold text-slate-700">Контейнеры · {overview.services.length}</h2>
          <div className="space-y-2">
            {overview.services.map((service) => {
              const isProtected = protectedContainers.has(service.name)
              const running = service.state === 'running'
              return (
                <article key={service.name} className="admin-card flex flex-col gap-4 py-4 xl:flex-row xl:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="break-all font-semibold text-slate-950">{service.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${running ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{running ? 'Работает' : service.state}</span></div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{service.status}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{service.image}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {isProtected ? <span className="inline-flex min-h-11 items-center rounded-xl bg-slate-100 px-3 text-xs font-medium text-slate-500">Защищён</span> : <>
                      {!running && <Button type="button" variant="secondary" onClick={() => void execute(service, 'start')} disabled={Boolean(actionBusy)}><Play size={17} /> Запустить</Button>}
                      {running && <Button type="button" variant="secondary" onClick={() => setPending({ service, action: 'restart' })} disabled={Boolean(actionBusy)}><ArrowClockwise size={17} /> Перезапуск</Button>}
                      {running && <Button type="button" variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setPending({ service, action: 'stop' })} disabled={Boolean(actionBusy)}><Stop size={17} /> Остановить</Button>}
                    </>}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </>}
      {!overview && !error && <p className="admin-card text-sm text-slate-500">Загружаем состояние сервера…</p>}
      <ConfirmDialog open={Boolean(pending)} title={pending?.action === 'stop' ? `Остановить ${pending.service.name}?` : `Перезапустить ${pending?.service.name}?`} description={pending?.action === 'stop' ? 'Контейнер и его данные сохранятся, но сервис станет недоступен до повторного запуска.' : 'Во время перезапуска сервис будет кратковременно недоступен.'} confirmLabel={pending?.action === 'stop' ? 'Остановить' : 'Перезапустить'} busy={Boolean(actionBusy)} onClose={() => { if (!actionBusy) setPending(null) }} onConfirm={() => { if (pending) void execute(pending.service, pending.action) }} />
    </div>
  )
}
