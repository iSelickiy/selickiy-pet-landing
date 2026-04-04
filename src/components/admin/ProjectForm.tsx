'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ImageUpload from '@/components/admin/ImageUpload'

interface Project {
  id: string
  title: string
  description: string
  techStack: string[]
  cardType: 'EXTERNAL_LINK' | 'DETAIL_PAGE'
  externalUrl: string | null
  pageContent: string | null
  status: 'DRAFT' | 'PUBLISHED'
  previewUrl: string | null
  [key: string]: unknown
}

interface ProjectFormProps {
  initialData?: Project
}

const TECH_SUGGESTIONS = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Python', 'PostgreSQL', 'Node.js', 'Docker', 'Redis', 'Chart.js', 'Prisma', 'DnD Kit', 'Telegram API', 'FastAPI']

export default function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title, setTitle] = useState(initialData?.title || '')
  const [techInput, setTechInput] = useState('')
  const [techTags, setTechTags] = useState<string[]>(initialData?.techStack || [])
  const [cardType, setCardType] = useState<'EXTERNAL_LINK' | 'DETAIL_PAGE'>(
    initialData?.cardType || 'EXTERNAL_LINK'
  )
  const [externalUrl, setExternalUrl] = useState(initialData?.externalUrl || '')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(
    initialData?.status || 'DRAFT'
  )
  const [previewUrl, setPreviewUrl] = useState(initialData?.previewUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const descriptionEditor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: initialData?.description || '',
    immediatelyRender: false,
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: initialData?.pageContent || '',
    immediatelyRender: false,
  })

  const addTech = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !techTags.includes(trimmed)) {
      setTechTags((prev) => [...prev, trimmed])
    }
  }

  const removeTech = (tag: string) => {
    setTechTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTech(techInput)
      setTechInput('')
    }
  }

  const addImageToEditor = useCallback(() => {
    const url = window.prompt('URL изображения:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLinkToEditor = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL ссылки:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      title,
      description: descriptionEditor?.getHTML() || '',
      techStack: techTags,
      cardType,
      externalUrl: cardType === 'EXTERNAL_LINK' ? externalUrl : null,
      pageContent: cardType === 'DETAIL_PAGE' ? editor?.getHTML() || '' : null,
      status,
      previewUrl: previewUrl || null,
    }

    try {
      const url = isEdit ? `/api/projects/${initialData.id}` : '/api/projects'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }

      router.push('/admin/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Редактировать проект' : 'Создать проект'}
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
          placeholder="Название проекта"
        />

        {descriptionEditor && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Описание</label>
            <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <ToolbarBtn
                active={descriptionEditor.isActive('bold')}
                onClick={() => descriptionEditor.chain().focus().toggleBold().run()}
              >
                B
              </ToolbarBtn>
              <ToolbarBtn
                active={descriptionEditor.isActive('italic')}
                onClick={() => descriptionEditor.chain().focus().toggleItalic().run()}
              >
                <em>I</em>
              </ToolbarBtn>
              <ToolbarBtn
                active={descriptionEditor.isActive('bulletList')}
                onClick={() => descriptionEditor.chain().focus().toggleBulletList().run()}
              >
                &bull;
              </ToolbarBtn>
              <ToolbarBtn
                active={descriptionEditor.isActive('orderedList')}
                onClick={() => descriptionEditor.chain().focus().toggleOrderedList().run()}
              >
                1.
              </ToolbarBtn>
              <ToolbarBtn
                active={descriptionEditor.isActive('link')}
                onClick={() => {
                  const previousUrl = descriptionEditor.getAttributes('link').href
                  const url = window.prompt('URL ссылки:', previousUrl)
                  if (url === null) return
                  if (url === '') {
                    descriptionEditor.chain().focus().extendMarkRange('link').unsetLink().run()
                  } else {
                    descriptionEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                  }
                }}
              >
                Link
              </ToolbarBtn>
            </div>
            <EditorContent
              editor={descriptionEditor}
              className="prose prose-sm max-w-none min-h-[100px] border border-gray-200 rounded-lg p-4
                focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent
                [&_.tiptap]:outline-none [&_.tiptap]:min-h-[80px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Технологии</label>
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            placeholder="Введите технологию и нажмите Enter"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {TECH_SUGGESTIONS.map((suggestion) => {
              const alreadyAdded = techTags.includes(suggestion)
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => !alreadyAdded && addTech(suggestion)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    alreadyAdded
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-accent/10 hover:border-accent hover:text-accent cursor-pointer'
                  }`}
                >
                  + {suggestion}
                </button>
              )
            })}
          </div>
          {techTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {techTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTech(tag)}
                    className="text-gray-400 hover:text-red-500 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Тип карточки</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cardType"
                checked={cardType === 'EXTERNAL_LINK'}
                onChange={() => setCardType('EXTERNAL_LINK')}
                className="accent-accent"
              />
              <span className="text-sm">Прямая ссылка</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cardType"
                checked={cardType === 'DETAIL_PAGE'}
                onChange={() => setCardType('DETAIL_PAGE')}
                className="accent-accent"
              />
              <span className="text-sm">Страница описания</span>
            </label>
          </div>
        </div>

        {cardType === 'EXTERNAL_LINK' && (
          <Input
            label="Внешняя ссылка"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://example.com"
            type="url"
          />
        )}

        {cardType === 'DETAIL_PAGE' && editor && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Содержание страницы</label>
            <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <ToolbarBtn
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                B
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <em>I</em>
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive('heading', { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                H2
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive('heading', { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                H3
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                &bull;
              </ToolbarBtn>
              <ToolbarBtn
                active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                1.
              </ToolbarBtn>
              <ToolbarBtn active={editor.isActive('link')} onClick={addLinkToEditor}>
                Link
              </ToolbarBtn>
              <ToolbarBtn active={false} onClick={addImageToEditor}>
                Img
              </ToolbarBtn>
            </div>
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none min-h-[200px] border border-gray-200 rounded-lg p-4
                focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent
                [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
            />
          </div>
        )}

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
          <label className="text-sm font-medium text-gray-700">Превью изображение</label>
          <ImageUpload value={previewUrl} onChange={setPreviewUrl} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/projects')}
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}

function ToolbarBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded transition-colors
        ${active ? 'bg-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
        border border-gray-200`}
    >
      {children}
    </button>
  )
}
