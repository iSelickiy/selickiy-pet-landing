'use client'

import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Link from '@tiptap/extension-link'
import StarterKit from '@tiptap/starter-kit'
import { ArrowCounterClockwise, ArrowClockwise, LinkSimple, ListBullets, ListNumbers, TextB, TextItalic } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'

export default function RichTextEditor({ value, onChange, label, minHeight = 180 }: { value: string; onChange: (value: string) => void; label: string; minHeight?: number }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false, protocols: ['http', 'https', 'mailto', 'tel'] })],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])
  if (!editor) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" aria-label={`Загрузка редактора: ${label}`} />

  const tool = (active: boolean, name: string, action: () => void, icon: React.ReactNode) => (
    <button type="button" onClick={action} aria-label={name} aria-pressed={active} className={`focus-ring flex h-10 w-10 items-center justify-center rounded-lg ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>{icon}</button>
  )

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setLinkOpen(false)
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
          {tool(editor.isActive('bold'), 'Жирный', () => editor.chain().focus().toggleBold().run(), <TextB size={19} weight="bold" />)}
          {tool(editor.isActive('italic'), 'Курсив', () => editor.chain().focus().toggleItalic().run(), <TextItalic size={19} />)}
          {tool(editor.isActive('bulletList'), 'Маркированный список', () => editor.chain().focus().toggleBulletList().run(), <ListBullets size={19} />)}
          {tool(editor.isActive('orderedList'), 'Нумерованный список', () => editor.chain().focus().toggleOrderedList().run(), <ListNumbers size={19} />)}
          {tool(editor.isActive('link'), 'Ссылка', () => { setLinkUrl(editor.getAttributes('link').href || ''); setLinkOpen(true) }, <LinkSimple size={19} />)}
          {tool(false, 'Отменить', () => editor.chain().focus().undo().run(), <ArrowCounterClockwise size={19} />)}
          {tool(false, 'Повторить', () => editor.chain().focus().redo().run(), <ArrowClockwise size={19} />)}
        </div>
        {linkOpen && (
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-blue-50 p-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">URL ссылки
              <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://… или mailto:…" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500" />
            </label>
            <div className="flex gap-2"><Button type="button" size="sm" onClick={applyLink}>Применить</Button><Button type="button" size="sm" variant="secondary" onClick={() => setLinkOpen(false)}>Отмена</Button></div>
          </div>
        )}
        <EditorContent editor={editor} className="admin-editor px-4 py-3 [&_.tiptap]:outline-none" style={{ minHeight }} />
      </div>
    </div>
  )
}
