'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
  updatedAt: string
}

interface CustomPageListProps {
  initialPages: CustomPage[]
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function CustomPageList({ initialPages }: CustomPageListProps) {
  const [pages, setPages] = useState(initialPages)
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  const folders = useMemo(() => {
    const set = new Set(pages.map((p) => p.folder).filter(Boolean))
    return Array.from(set).sort()
  }, [pages])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    pages.forEach((p) => parseTags(p.tags).forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [pages])

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !page.title.toLowerCase().includes(q) &&
          !page.slug.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (selectedFolder && page.folder !== selectedFolder) {
        return false
      }
      if (selectedTag) {
        const pageTags = parseTags(page.tags)
        if (!pageTags.includes(selectedTag)) {
          return false
        }
      }
      return true
    })
  }, [pages, search, selectedFolder, selectedTag])

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить custom page?')) return

    const res = await fetch(`/api/custom-pages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPages((prev) => prev.filter((page) => page.id !== id))
    }
  }

  const handleTogglePublish = async (page: CustomPage) => {
    const formData = new FormData()
    formData.append('title', page.title)
    formData.append('slug', page.slug)
    formData.append('status', page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
    formData.append('folder', page.folder)
    formData.append('tags', page.tags)

    const res = await fetch(`/api/custom-pages/${page.id}`, {
      method: 'PUT',
      body: formData,
    })

    if (res.ok) {
      const updated = await res.json()
      setPages((prev) => prev.map((item) => (item.id === page.id ? updated : item)))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Pages</h1>
        <Link href="/admin/custom-pages/new">
          <Button>Создать страницу</Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или slug..."
        />

        {folders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-1">Папки:</span>
            <button
              onClick={() => setSelectedFolder('')}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                !selectedFolder
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            {folders.map((f) => (
              <button
                key={f}
                onClick={() =>
                  setSelectedFolder(selectedFolder === f ? '' : f)
                }
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  selectedFolder === f
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-1">Теги:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                !selectedTag
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Все
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  selectedTag === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredPages.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          {pages.length === 0
            ? 'Custom pages пока нет'
            : 'Ничего не найдено'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{page.title}</p>
                  {page.folder && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {page.folder}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 font-mono">/custom/{page.slug}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {page.originalName} · {formatSize(page.size)}
                </p>
                {(() => {
                  const pageTags = parseTags(page.tags)
                  if (pageTags.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pageTags.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <span
                className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                  page.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {page.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTogglePublish(page)}
                >
                  {page.status === 'PUBLISHED' ? 'Снять' : 'Опубликовать'}
                </Button>
                <Link href={`/custom/${page.slug}`} target="_blank">
                  <Button variant="secondary" size="sm">
                    Открыть
                  </Button>
                </Link>
                <Link href={`/admin/custom-pages/${page.id}`}>
                  <Button variant="secondary" size="sm">
                    Редактировать
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleDelete(page.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
