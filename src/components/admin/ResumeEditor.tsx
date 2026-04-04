'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Button from '@/components/ui/Button'

interface Experience {
  id: string
  company: string
  position: string
  periodFrom: string
  periodTo: string
  description: string
  sortOrder: number
}

interface ResumeEditorProps {
  experiences: Experience[]
  skillsContent: string
}

export default function ResumeEditor({ experiences: initialExperiences, skillsContent }: ResumeEditorProps) {
  return (
    <div className="space-y-8">
      <ExperienceSection initialExperiences={initialExperiences} />
      <SkillsSection initialContent={skillsContent} />
    </div>
  )
}

/* ─────────── Section A: Work Experience ─────────── */

function ExperienceSection({ initialExperiences }: { initialExperiences: Experience[] }) {
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addExperience = async () => {
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: 'Новая компания',
          position: 'Должность',
          periodFrom: '',
          periodTo: '',
          description: '',
        }),
      })
      if (!res.ok) throw new Error()
      const exp = await res.json()
      setExperiences((prev) => [...prev, exp])
      setExpandedId(exp.id)
    } catch {
      alert('Ошибка создания записи')
    }
  }

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = experiences.findIndex((e) => e.id === active.id)
    const newIndex = experiences.findIndex((e) => e.id === over.id)
    const reordered = arrayMove(experiences, oldIndex, newIndex)
    setExperiences(reordered)

    try {
      await fetch('/api/resume/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((e) => e.id) }),
      })
    } catch {
      // revert on error
      setExperiences(experiences)
    }
  }

  const deleteExperience = async (id: string) => {
    if (!confirm('Удалить запись?')) return
    try {
      await fetch(`/api/resume/${id}`, { method: 'DELETE' })
      setExperiences((prev) => prev.filter((e) => e.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      alert('Ошибка удаления')
    }
  }

  const updateExperience = (id: string, field: string, value: string) => {
    setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Опыт работы</h2>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={experiences.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {experiences.map((exp) => (
              <SortableExperienceCard
                key={exp.id}
                experience={exp}
                isExpanded={expandedId === exp.id}
                onToggle={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                onUpdate={updateExperience}
                onDelete={() => deleteExperience(exp.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addExperience}
        className="mt-4 text-sm text-accent hover:underline font-medium"
      >
        + Добавить опыт
      </button>
    </section>
  )
}

function SortableExperienceCard({
  experience,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  experience: Experience
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (id: string, field: string, value: string) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: experience.id,
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/resume/${experience.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: experience.company,
          position: experience.position,
          periodFrom: experience.periodFrom,
          periodTo: experience.periodTo,
          description: experience.description,
        }),
      })
      if (!res.ok) throw new Error()
      setToast('Сохранено')
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast('Ошибка')
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          className="cursor-grab text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <div className="flex-1">
          <span className="font-medium text-gray-900">{experience.company}</span>
          <span className="text-gray-500 mx-2">&middot;</span>
          <span className="text-gray-600">{experience.position}</span>
          {(experience.periodFrom || experience.periodTo) && (
            <>
              <span className="text-gray-500 mx-2">&middot;</span>
              <span className="text-sm text-gray-500">
                {experience.periodFrom} — {experience.periodTo}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isExpanded
              ? 'bg-accent text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          {isExpanded ? 'Свернуть' : 'Редактировать'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          title="Удалить"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
              <input
                type="text"
                value={experience.company}
                onChange={(e) => onUpdate(experience.id, 'company', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input
                type="text"
                value={experience.position}
                onChange={(e) => onUpdate(experience.id, 'position', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Период с</label>
              <input
                type="text"
                value={experience.periodFrom}
                onChange={(e) => onUpdate(experience.id, 'periodFrom', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Период по</label>
              <input
                type="text"
                value={experience.periodTo}
                onChange={(e) => onUpdate(experience.id, 'periodTo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <ExperienceDescriptionEditor
              content={experience.description}
              onChange={(html) => onUpdate(experience.id, 'description', html)}
            />
          </div>

          <div className="flex items-center gap-2">
            {toast && (
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                {toast}
              </span>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExperienceDescriptionEditor({
  content,
  onChange,
}: {
  content: string
  onChange: (html: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

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
    <div>
      <div className="flex flex-wrap gap-1 mb-2 p-2 bg-white rounded-lg border border-gray-200">
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
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Список"
        >
          &bull;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный"
        >
          1.
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="Ссылка">
          🔗
        </ToolbarButton>
        <ToolbarButton active={false} onClick={addImage} title="Изображение">
          🖼
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[120px] border border-gray-200 rounded-lg p-3 bg-white
          focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent
          [&_.tiptap]:outline-none [&_.tiptap]:min-h-[100px]"
      />
    </div>
  )
}

/* ─────────── Section B: Skills ─────────── */

function SkillsSection({ initialContent }: { initialContent: string }) {
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    immediatelyRender: false,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'skills', content: editor.getHTML() }),
      })
      if (!res.ok) throw new Error()
      showToast('Сохранено')
    } catch {
      showToast('Ошибка сохранения')
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
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Навыки</h2>
        <div className="flex items-center gap-2">
          {toast && (
            <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
              {toast}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

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
          title="H2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="H3"
        >
          H3
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Список"
        >
          &bull;
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный"
        >
          1.
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1" />
        <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="Ссылка">
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
    </section>
  )
}

/* ─────────── Shared Toolbar Button ─────────── */

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
