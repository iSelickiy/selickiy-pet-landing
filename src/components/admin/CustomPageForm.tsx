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
  existingFolders?: string[]
  existingTags?: string[]
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CustomPageForm({
  initialData,
  existingFolders = [],
  existingTags = [],
}: CustomPageFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initialData)

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT')
  const [folder, setFolder] = useState(initialData?.folder || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (initialData?.tags) {
      try {
        return JSON.parse(initialData.tags)
      } catch {
        return []
      }
    }
    return []
  })
  const [newTag, setNewTag] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const publicUrl = slug ? `/custom/${slug}` : null

  const availableTags = existingTags.filter((t) => !selectedTags.includes(t))

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addNewTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
    }
    setNewTag('')
  }

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
      formData.append('tags', JSON.stringify(selectedTags))
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Папка</label>
          <input
            list="folder-list"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="Выбери или введи название папки..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <datalist id="folder-list">
            {existingFolders.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Теги</label>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  {tag}
                  <span className="ml-0.5">&times;</span>
                </span>
              ))}
            </div>
          )}

          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-400 mr-1 self-center">
                {selectedTags.length ? 'Добавить:' : 'Выбери:'}
              </span>
              {availableTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              addNewTag()
            }}
            className="flex gap-2"
          >
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Новый тег..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
              disabled={!newTag.trim()}
            >
              Добавить
            </button>
          </form>
        </div>

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
