'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, DownloadSimple, X } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { readApiError } from '@/lib/clientApi'
import type { VaultAccessKit, VaultSummary } from '@/lib/infrastructureTypes'

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function SecretRow({ label, value, masked = false, onCopy }: { label: string; value: string; masked?: boolean; onCopy: () => void }) {
  return (
    <div className="border-t border-slate-200 py-3 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <button type="button" onClick={onCopy} className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-blue-700 hover:bg-blue-50">
          <Copy size={16} /> Копировать
        </button>
      </div>
      <code className="mt-1 block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-800">{masked ? '••••••••••••••••••••••••' : value}</code>
    </div>
  )
}

export default function VaultCreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (vault: VaultSummary) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kit, setKit] = useState<VaultAccessKit | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const attemptClose = () => {
    if (kit && !saved) {
      setError('Сначала сохраните комплект и подтвердите это ниже')
      return
    }
    onClose()
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось создать vault'))
      const body = await response.json() as { vault: VaultAccessKit }
      setKit(body.vault)
      onCreated({ name: body.vault.name, database: body.vault.database, documents: 0, sizeBytes: 0, status: 'ready' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать vault')
    } finally {
      setBusy(false)
    }
  }

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setError(null)
    } catch {
      setError('Браузер не разрешил копирование — скачайте файлы')
    }
  }

  return (
    <dialog ref={ref} onCancel={(event) => { event.preventDefault(); attemptClose() }} onClick={(event) => { if (event.target === ref.current) attemptClose() }} className="m-auto max-h-[92dvh] w-[min(94vw,680px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/60">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">{kit ? 'Сохраните доступ' : 'Новый vault'}</h2>
          <p className="mt-1 text-sm text-slate-500">{kit ? `База ${kit.database} создана` : 'Отдельная база и не-admin пользователь CouchDB'}</p>
        </div>
        <button type="button" onClick={attemptClose} disabled={busy} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Закрыть"><X size={20} /></button>
      </div>

      {!kit ? (
        <form onSubmit={(event) => void submit(event)} className="space-y-5 p-5 sm:p-6">
          <Input label="Slug vault’а" name="vault-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="work-repo" autoFocus required minLength={2} maxLength={30} pattern="[a-z][a-z0-9](?:[a-z0-9\-]{0,27}[a-z0-9])?" aria-describedby="vault-slug-hint" />
          <p id="vault-slug-hint" className="-mt-3 text-xs leading-5 text-slate-500">Латиница, цифры и дефис. Будет создана база <code>obsidian-{slug || 'work-repo'}</code>. Название потом используется в Obsidian как имя vault.</p>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">E2EE passphrase и Setup URI будут сгенерированы автоматически. На сервере они не сохраняются.</div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={attemptClose} disabled={busy}>Отмена</Button>
            <Button type="submit" disabled={busy || slug.length < 2}>{busy ? 'Создаём, около минуты…' : 'Создать vault'}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong>Показано один раз.</strong> Скачайте оба файла и храните их раздельно. Без E2EE passphrase зашифрованные заметки восстановить нельзя.</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => download(`${kit.database}-uri.txt`, `Server: https://notes.selickiy.space\nDatabase: ${kit.database}\nUsername: ${kit.username}\n\nSetup URI:\n${kit.setupUri}\n`)}><DownloadSimple size={18} /> Скачать URI</Button>
            <Button type="button" variant="secondary" onClick={() => download(`${kit.database}-secrets.txt`, `Setup URI passphrase: ${kit.setupPassphrase}\nE2EE passphrase: ${kit.encryptionPassphrase}\nRecovery code: ${kit.recoveryCode}\nSync username: ${kit.username}\nSync password: ${kit.password}\nExpires: ${kit.expiresAt || 'not specified'}\n`)}><DownloadSimple size={18} /> Скачать секреты</Button>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-1">
            <SecretRow label="Setup URI" value={kit.setupUri} masked onCopy={() => void copy('uri', kit.setupUri)} />
            <SecretRow label="Passphrase для URI" value={kit.setupPassphrase} onCopy={() => void copy('setup', kit.setupPassphrase)} />
            <SecretRow label="E2EE passphrase" value={kit.encryptionPassphrase} onCopy={() => void copy('e2ee', kit.encryptionPassphrase)} />
            <SecretRow label="Recovery code" value={kit.recoveryCode} onCopy={() => void copy('recovery', kit.recoveryCode)} />
          </div>
          {kit.expiresAt && <p className="text-xs text-slate-500">Setup URI действует до: {kit.expiresAt}</p>}
          {copied && <p className="flex items-center gap-2 text-sm text-emerald-700"><Check size={17} /> Скопировано: {copied}</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
            <input type="checkbox" checked={saved} onChange={(event) => { setSaved(event.target.checked); setError(null) }} className="mt-1 h-5 w-5 accent-blue-600" />
            Я скачал или скопировал URI, E2EE passphrase и recovery code
          </label>
          <Button type="button" className="w-full" onClick={attemptClose} disabled={!saved}>Готово</Button>
        </div>
      )}
    </dialog>
  )
}
