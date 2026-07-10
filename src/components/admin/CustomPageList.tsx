'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowSquareOut, Eye, EyeSlash, FileHtml, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError } from '@/lib/clientApi'

interface CustomPage { id: string; title: string; slug: string; status: 'DRAFT' | 'PUBLISHED'; folder: string; tags: string; originalName: string; size: number; updatedAt: string }
const parseTags = (value: string) => { try { return JSON.parse(value) as string[] } catch { return [] } }

export default function CustomPageList({ initialPages }: { initialPages: CustomPage[] }) {
  const [pages, setPages] = useState(initialPages)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('')
  const [deleting, setDeleting] = useState<CustomPage | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)
  const folders = useMemo(() => Array.from(new Set(pages.map((page) => page.folder).filter(Boolean))).sort(), [pages])
  const filtered = pages.filter((page) => (!folder || page.folder === folder) && (!search || `${page.title} ${page.slug}`.toLowerCase().includes(search.toLowerCase())))

  const toggle = async (page: CustomPage) => {
    setBusy(page.id); setStatus(null)
    const body = new FormData()
    body.append('title', page.title); body.append('slug', page.slug); body.append('folder', page.folder); body.append('tags', page.tags)
    body.append('status', page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
    try {
      const response = await fetch(`/api/custom-pages/${page.id}`, { method: 'PUT', body })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось изменить статус'))
      const updated = await response.json()
      setPages((current) => current.map((item) => item.id === page.id ? updated : item))
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка статуса', error: true }) }
    finally { setBusy(null) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(deleting.id)
    try {
      const response = await fetch(`/api/custom-pages/${deleting.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось удалить страницу'))
      setPages((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null)
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка удаления', error: true }) }
    finally { setBusy(null) }
  }

  return (
    <div>
      <PageHeader title="Custom Pages" description="HTML‑артефакты, прототипы и страницы, которыми можно делиться по прямой ссылке." action={<Link href={`/admin/custom-pages/new${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"><Plus size={18} /> Новая страница</Link>} />
      <div className="admin-card mb-5 space-y-4">
        <Input label="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или slug" />
        <div className="flex flex-wrap gap-2" aria-label="Фильтр по папке"><button type="button" onClick={() => setFolder('')} aria-pressed={!folder} className={`focus-ring min-h-11 rounded-xl px-3 text-sm ${!folder ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Все</button>{folders.map((value) => <button key={value} type="button" onClick={() => setFolder(value)} aria-pressed={folder === value} className={`focus-ring min-h-11 rounded-xl px-3 text-sm ${folder === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>{value}</button>)}</div>
      </div>
      <StatusMessage message={status?.message || null} tone={status?.error ? 'error' : 'success'} />
      <div className="mt-4 space-y-3">
        {filtered.map((page) => (
          <article key={page.id} className="admin-card flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileHtml size={24} /></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{page.title}</h2>{page.folder && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{page.folder}</span>}<span className={`rounded-full px-2 py-1 text-xs ${page.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{page.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}</span></div><p className="mt-1 font-mono text-xs text-slate-500">/custom/{page.slug}</p><div className="mt-2 flex flex-wrap gap-1">{parseTags(page.tags).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{tag}</span>)}</div></div>
            <div className="flex flex-wrap gap-2">
              {page.status === 'PUBLISHED' && <a href={`/custom/${page.slug}`} target="_blank" rel="noopener noreferrer" className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600" aria-label={`Открыть ${page.title}`}><ArrowSquareOut size={18} /></a>}
              <button type="button" onClick={() => void toggle(page)} disabled={busy === page.id} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700">{page.status === 'PUBLISHED' ? <EyeSlash size={18} /> : <Eye size={18} />}{page.status === 'PUBLISHED' ? 'Скрыть' : 'Опубликовать'}</button>
              <Link href={`/admin/custom-pages/${page.id}`} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600" aria-label={`Изменить ${page.title}`}><PencilSimple size={18} /></Link>
              <Button type="button" variant="danger" onClick={() => setDeleting(page)} aria-label={`Удалить ${page.title}`}><Trash size={18} /></Button>
            </div>
          </article>
        ))}
        {!filtered.length && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Ничего не найдено.</p>}
      </div>
      <ConfirmDialog open={Boolean(deleting)} title="Удалить Custom Page?" description={deleting ? `HTML-файл и запись «${deleting.title}» будут удалены.` : ''} busy={busy === deleting?.id} onClose={() => setDeleting(null)} onConfirm={() => void remove()} />
    </div>
  )
}
