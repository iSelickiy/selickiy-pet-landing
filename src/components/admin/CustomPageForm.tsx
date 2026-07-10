'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DragEvent, FormEvent, useMemo, useState } from 'react'
import { ArrowSquareOut, FileHtml, UploadSimple } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError } from '@/lib/clientApi'

interface CustomPageData { id: string; title: string; slug: string; status: 'DRAFT' | 'PUBLISHED'; folder: string; tags: string; originalName: string; size: number }

export default function CustomPageForm({ initialData, existingFolders = [], existingTags = [], defaultFolder = '' }: { initialData?: CustomPageData; existingFolders?: string[]; existingTags?: string[]; defaultFolder?: string }) {
  const router = useRouter()
  const initialTags = useMemo(() => { try { return (JSON.parse(initialData?.tags || '[]') as string[]).join(', ') } catch { return '' } }, [initialData?.tags])
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [status, setStatus] = useState(initialData?.status || 'DRAFT')
  const [folder, setFolder] = useState(initialData?.folder || defaultFolder)
  const [tags, setTags] = useState(initialTags)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chooseFile = (candidate?: File) => {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.html') || candidate.size > 5 * 1024 * 1024) { setError('Нужен HTML-файл до 5 МБ'); return }
    setFile(candidate); setDirty(true); setError(null)
  }
  const drop = (event: DragEvent) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      if (!initialData && !file) throw new Error('Выберите HTML-файл')
      const body = new FormData()
      body.append('title', title); body.append('slug', slug); body.append('status', status); body.append('folder', folder)
      body.append('tags', JSON.stringify(tags.split(',').map((tag) => tag.trim()).filter(Boolean)))
      if (file) body.append('file', file)
      const response = await fetch(initialData ? `/api/custom-pages/${initialData.id}` : '/api/custom-pages', { method: initialData ? 'PUT' : 'POST', body })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось сохранить страницу'))
      setDirty(false); router.push('/admin/custom-pages'); router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Ошибка сохранения') }
    finally { setSaving(false) }
  }
  const mark = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setDirty(true) }

  return (
    <form onSubmit={submit} className="pb-24">
      <PageHeader title={initialData ? 'Редактирование Custom Page' : 'Новая Custom Page'} description="Самостоятельный HTML‑артефакт: прототип, заметка, интерактив или что угодно ещё." action={initialData?.status === 'PUBLISHED' ? <Link href={`/custom/${initialData.slug}`} target="_blank" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700"><ArrowSquareOut size={18} /> Открыть</Link> : undefined} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="admin-card grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Название" required value={title} onChange={(event) => mark(setTitle)(event.target.value)} /></div>
          <Input label="Slug" value={slug} placeholder="создастся автоматически" onChange={(event) => mark(setSlug)(event.target.value)} />
          <label className="text-sm font-medium text-slate-700">Статус<select value={status} onChange={(event) => mark(setStatus)(event.target.value as 'DRAFT' | 'PUBLISHED')} className="admin-select mt-1"><option value="DRAFT">Черновик</option><option value="PUBLISHED">Опубликована</option></select></label>
          <div><Input label="Папка" value={folder} list="custom-page-folders" onChange={(event) => mark(setFolder)(event.target.value)} /><datalist id="custom-page-folders">{existingFolders.map((value) => <option key={value} value={value} />)}</datalist></div>
          <div><Input label="Теги через запятую" value={tags} list="custom-page-tags" onChange={(event) => mark(setTags)(event.target.value)} /><datalist id="custom-page-tags">{existingTags.map((value) => <option key={value} value={value} />)}</datalist></div>
        </section>
        <section className="admin-card">
          <h2 className="admin-card-title">HTML-файл</h2><p className="admin-card-description">До 5 МБ. SVG и другие форматы не принимаются.</p>
          <label onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={drop} className={`focus-ring mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}>
            {file || initialData ? <FileHtml size={34} className="text-blue-600" /> : <UploadSimple size={34} className="text-slate-400" />}
            <span className="mt-3 text-sm font-semibold text-slate-700">{file?.name || initialData?.originalName || 'Перетащи файл или выбери'}</span>
            <span className="mt-1 text-xs text-slate-500">{file ? `${Math.round(file.size / 1024)} КБ` : 'Только .html'}</span>
            <input type="file" accept=".html,text/html" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
          </label>
        </section>
      </div>
      <div className="admin-savebar"><div><StatusMessage message={error} tone="error" />{dirty && !error && <p className="text-sm text-amber-700">Есть несохранённые изменения</p>}</div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => router.push('/admin/custom-pages')}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : 'Сохранить страницу'}</Button></div></div>
    </form>
  )
}
