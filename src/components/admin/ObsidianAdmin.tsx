'use client'

import { useState } from 'react'
import { Check, Copy, Database, Plus, ArrowClockwise } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import VaultCreateDialog from '@/components/admin/VaultCreateDialog'
import { readApiError } from '@/lib/clientApi'
import type { VaultSummary } from '@/lib/infrastructureTypes'

function formatBytes(bytes: number) {
  if (!bytes) return '0 Б'
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function formatVaultCount(count: number) {
  const lastTwo = count % 100
  const last = count % 10
  if (last === 1 && lastTwo !== 11) return `${count} vault`
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${count} vault’а`
  return `${count} vault’ов`
}

export default function ObsidianAdmin({ initialVaults, initialError }: { initialVaults: VaultSummary[]; initialError?: string }) {
  const [vaults, setVaults] = useState(initialVaults)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError || null)
  const [copied, setCopied] = useState(false)

  const refresh = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/vaults', { cache: 'no-store' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось обновить список'))
      const body = await response.json() as { vaults: VaultSummary[] }
      setVaults(body.vaults)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось обновить список')
    } finally {
      setBusy(false)
    }
  }

  const copyServer = async () => {
    await navigator.clipboard.writeText('https://notes.selickiy.space')
    setCopied(true)
  }

  return (
    <div>
      <PageHeader title="Obsidian" description="Независимые vault’ы на одном CouchDB. У каждого своя база, пользователь и шифрование." action={<Button type="button" onClick={() => setCreating(true)}><Plus size={18} /> Новый vault</Button>} />
      <StatusMessage message={error} tone="error" />
      <section className="admin-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Database size={22} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sync endpoint</p><code className="text-sm text-slate-900">notes.selickiy.space</code></div>
        </div>
        <Button type="button" variant="secondary" onClick={() => void copyServer()}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? 'Скопировано' : 'Копировать адрес'}</Button>
      </section>

      <section className="mt-6" aria-labelledby="vault-list-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="vault-list-title" className="text-sm font-semibold text-slate-700">{formatVaultCount(vaults.length)}</h2>
          <button type="button" onClick={() => void refresh()} disabled={busy} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50"><ArrowClockwise size={17} className={busy ? 'animate-spin' : ''} /> Обновить</button>
        </div>
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_110px_100px_90px] gap-4 px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid"><span>Vault</span><span>База</span><span>Документы</span><span>Размер</span><span>Статус</span></div>
        <div className="space-y-2">
          {vaults.map((vault) => (
            <article key={vault.database} className="admin-card grid gap-3 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.5fr)_110px_100px_90px] md:items-center md:gap-4">
              <div><h3 className="font-semibold text-slate-950">{vault.name}</h3><span className="mt-1 text-xs text-slate-500 md:hidden">{vault.database}</span></div>
              <code className="hidden truncate text-xs text-slate-600 md:block">{vault.database}</code>
              <div className="flex justify-between text-sm text-slate-600 md:block"><span className="md:hidden">Документы</span><span>{vault.documents}</span></div>
              <div className="flex justify-between text-sm text-slate-600 md:block"><span className="md:hidden">Размер</span><span>{formatBytes(vault.sizeBytes)}</span></div>
              <div className="flex justify-between md:block"><span className="text-sm text-slate-600 md:hidden">Статус</span><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Готов</span></div>
            </article>
          ))}
        </div>
        {!vaults.length && !error && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Vault’ов пока нет. Создайте первый для личных заметок или репозитория.</p>}
      </section>
      {creating && <VaultCreateDialog open onClose={() => setCreating(false)} onCreated={(vault) => setVaults((current) => current.some((item) => item.database === vault.database) ? current : [...current, vault].sort((a, b) => a.database.localeCompare(b.database)))} />}
    </div>
  )
}
