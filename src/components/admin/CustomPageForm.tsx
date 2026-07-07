'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CustomPage {
  id: string
  title: string
  slug: string
  originalName: string
  size: number
  status: 'DRAFT' | 'PUBLISHED'
  folder: string
  tags: string
}

interface CustomPageFormProps {
  initialData?: CustomPage
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CustomPageForm({ initialData }: CustomPageFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initialData)

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT')
  const [folder, setFolder] = useState(initialData?.folder || '')
  const [tagsStr, setTagsStr] = useState(() => {
    if (initialData?.tags) {
      try {
        return JSON.parse(initialData.tags).join(', ')
      } catch {
        return ''
      }
    }
    return ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const publicUrl = slug ? `/custom/${slug}` : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('status', status)
      formData.append('folder', folder)
      const parsedTags = tagsStr
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
      formData.append('tags', JSON.stringify(parsedTags))
      if (file) {
        formData.append('file', file)
      }

      const res = await fetch(
        isEdit ? `/api/custom-pages/${initialData?.id}` : '/api/custom-pages',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: formData,
        }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка сохранения')
      }

      router.push('/admin/custom-pages')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Редактировать custom page' : 'Создать custom page'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <Input
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Например, Urals landing"
        />

        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Автогенерируется, но можно задать вручную"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Статус</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликован</option>
          </select>
        </div>

        <Input
          label="Папка"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="Например, landings, tests, drafts"
        />

        <Input
          label="Теги (через запятую)"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="Например, promo, demo, wip"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            HTML-файл {isEdit ? '(можно заменить)' : ''}
          </label>
          <input
            type="file"
            accept=".html,text/html"
            required={!isEdit}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <p className="text-xs text-gray-500">
            Поддерживается только одиночный `.html` файл. Скрипты будут выполняться в изолированном iframe.
          </p>
          {isEdit && initialData && (
            <p className="text-xs text-gray-600">
              Текущий файл: {initialData.originalName} ({formatSize(initialData.size)})
            </p>
          )}
        </div>

        {publicUrl && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Публичная ссылка: <span className="font-mono">{publicUrl}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/custom-pages')}
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}
