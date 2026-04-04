'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Button from '@/components/ui/Button'

interface ContentEditorProps {
  sectionKey: string
  label: string
  initialContent: string
}

export default function ContentEditor({ sectionKey, label, initialContent }: ContentEditorProps) {
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    immediatelyRender: false,
  })

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: sectionKey, content: editor.getHTML() }),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      showToast('success', 'Сохранено')
    } catch {
      showToast('error', 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL изображения:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
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

  if (!editor) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center gap-2">
          {toast && (
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                toast.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {toast.message}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
        >
          <em>I</em>
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок H2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Заголовок H3"
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Заголовок H4"
        >
          H4
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Маркированный список"
        >
          &bull;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          1.
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={addLink}
          title="Ссылка"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton active={false} onClick={addImage} title="Изображение">
          🖼
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[200px] border border-gray-200 rounded-lg p-4
          focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent
          [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
      />
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs font-medium rounded transition-colors
        ${active ? 'bg-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
        border border-gray-200`}
    >
      {children}
    </button>
  )
}
