'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/admin/PageHeader'
import RichTextEditor from '@/components/admin/RichTextEditor'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError, uploadImageWithProgress } from '@/lib/clientApi'

interface ProjectData {
  id: string
  title: string
  slug: string
  description: string
  previewUrl: string | null
  techStack: string[]
  status: 'DRAFT' | 'PUBLISHED'
  stage: string
  cardType: 'EXTERNAL_LINK' | 'DETAIL_PAGE'
  externalUrl: string | null
  pageContent: string | null
  sortOrder?: number
}

export default function ProjectForm({ initialData }: { initialData?: ProjectData }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    previewUrl: initialData?.previewUrl || '',
    techStack: initialData?.techStack.join(', ') || '',
    status: initialData?.status || 'DRAFT',
    stage: initialData?.stage || 'В процессе',
    cardType: initialData?.cardType || 'EXTERNAL_LINK',
    externalUrl: initialData?.externalUrl || '',
    pageContent: initialData?.pageContent || '',
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const update = (key: keyof typeof form, value: string) => { setForm((current) => ({ ...current, [key]: value })); setDirty(true) }

  const uploadPreview = async (file: File) => {
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Превью: JPEG, PNG, WebP, GIF или AVIF до 5 МБ'); return
    }
    try {
      setUploadProgress(0)
      const result = await uploadImageWithProgress(file, setUploadProgress)
      update('previewUrl', result.url)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Ошибка загрузки') }
    finally { setUploadProgress(null) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      const response = await fetch(initialData ? `/api/projects/${initialData.id}` : '/api/projects', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          techStack: form.techStack.split(',').map((item) => item.trim()).filter(Boolean),
          previewUrl: form.previewUrl || null,
          externalUrl: form.externalUrl || null,
          pageContent: form.pageContent || null,
        }),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось сохранить проект'))
      setDirty(false); router.push('/admin/projects'); router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Ошибка сохранения') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="pb-24">
      <PageHeader title={initialData ? 'Редактирование проекта' : 'Новый проект'} description="Можно публиковать и законченные продукты, и честные прототипы — статус объяснит контекст." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="admin-card grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="Название" required value={form.title} onChange={(event) => update('title', event.target.value)} /></div>
            <Input label="Slug" value={form.slug} placeholder="создастся автоматически" onChange={(event) => update('slug', event.target.value)} />
            <Input label="Стадия" value={form.stage} list="project-stages" onChange={(event) => update('stage', event.target.value)} />
            <datalist id="project-stages"><option value="Живой" /><option value="В процессе" /><option value="Прототип" /><option value="Набросок" /><option value="На паузе" /><option value="Архив" /></datalist>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">Короткое описание
              <textarea required value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} className="admin-textarea mt-1" />
            </label>
            <div className="sm:col-span-2"><Input label="Технологии через запятую" value={form.techStack} placeholder="Next.js, React, PostgreSQL" onChange={(event) => update('techStack', event.target.value)} /></div>
          </section>
          {form.cardType === 'DETAIL_PAGE' && <section className="admin-card"><RichTextEditor label="История создания и подробности" value={form.pageContent} onChange={(value) => update('pageContent', value)} minHeight={260} /></section>}
        </div>
        <aside className="space-y-6">
          <section className="admin-card space-y-4">
            <label className="block text-sm font-medium text-slate-700">Публикация<select value={form.status} onChange={(event) => update('status', event.target.value)} className="admin-select mt-1"><option value="DRAFT">Черновик</option><option value="PUBLISHED">Опубликован</option></select></label>
            <label className="block text-sm font-medium text-slate-700">Тип карточки<select value={form.cardType} onChange={(event) => update('cardType', event.target.value)} className="admin-select mt-1"><option value="EXTERNAL_LINK">Внешняя ссылка</option><option value="DETAIL_PAGE">Страница проекта</option></select></label>
            {form.cardType === 'EXTERNAL_LINK' && <Input label="Ссылка на проект" value={form.externalUrl} placeholder="https://…" onChange={(event) => update('externalUrl', event.target.value)} />}
          </section>
          <section className="admin-card">
            <h2 className="admin-card-title">Превью</h2>
            <div className="relative mt-4 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{form.previewUrl ? <Image src={form.previewUrl} alt="Превью проекта" fill sizes="340px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Изображение не выбрано</div>}</div>
            <label className="focus-ring mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Загрузить изображение<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPreview(file) }} /></label>
            {uploadProgress !== null && <p className="mt-2 text-xs text-slate-500">Загрузка: {uploadProgress}%</p>}
          </section>
        </aside>
      </div>
      <div className="admin-savebar"><div><StatusMessage message={error} tone="error" />{dirty && !error && <p className="text-sm text-amber-700">Есть несохранённые изменения</p>}</div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => router.push('/admin/projects')}>Отмена</Button><Button type="submit" disabled={saving}>{saving ? 'Сохраняю…' : 'Сохранить проект'}</Button></div></div>
    </form>
  )
}
