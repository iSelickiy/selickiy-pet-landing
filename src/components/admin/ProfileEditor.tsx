'use client'

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Button from '@/components/ui/Button'

interface ContactButton {
  id: string
  label: string
  url: string
  icon: string
  sortOrder: number
}

interface SocialLink {
  id: string
  platform: string
  url: string
  enabled: boolean
  sortOrder: number
}

interface ProfileEditorProps {
  settings: Record<string, string>
  contactButtons: ContactButton[]
  socialLinks: SocialLink[]
}

const ICON_OPTIONS = [
  { value: 'calendar', label: 'Календарь' },
  { value: 'link', label: 'Ссылка' },
  { value: 'arrow-right', label: 'Стрелка' },
  { value: 'phone', label: 'Телефон' },
  { value: 'video', label: 'Видео' },
  { value: 'message', label: 'Сообщение' },
]

const SOCIAL_PLATFORMS = [
  { platform: 'telegram', label: 'Telegram' },
  { platform: 'email', label: 'Email' },
  { platform: 'instagram', label: 'Instagram' },
  { platform: 'github', label: 'GitHub' },
  { platform: 'vk', label: 'ВКонтакте' },
  { platform: 'linkedin', label: 'LinkedIn' },
  { platform: 'youtube', label: 'YouTube' },
  { platform: 'whatsapp', label: 'WhatsApp' },
  { platform: 'habr', label: 'Хабр' },
]

export default function ProfileEditor({ settings, contactButtons: initialButtons, socialLinks: initialLinks }: ProfileEditorProps) {
  return (
    <div className="space-y-8">
      {/* Link to site */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Открыть сайт
        </a>
      </div>
      <IdentitySection settings={settings} />
      <AboutSection initialContent={settings.aboutContent ?? ''} />
      <ContactsSection initialButtons={initialButtons} initialLinks={initialLinks} />
    </div>
  )
}

/* ─────────── Section A: Identity ─────────── */

function IdentitySection({ settings }: { settings: Record<string, string> }) {
  const [firstName, setFirstName] = useState(settings.firstName ?? '')
  const [lastName, setLastName] = useState(settings.lastName ?? '')
  const [avatarMode, setAvatarMode] = useState<'static' | 'dynamic'>(
    (settings.avatarMode as 'static' | 'dynamic') ?? 'static'
  )
  const [avatarStatic, setAvatarStatic] = useState(settings.avatarStatic ?? '')
  const [avatarLight, setAvatarLight] = useState(settings.avatarLight ?? '')
  const [avatarDark, setAvatarDark] = useState(settings.avatarDark ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setter(url)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const pairs: [string, string][] = [
        ['firstName', firstName],
        ['lastName', lastName],
        ['avatarMode', avatarMode],
        ['avatarStatic', avatarStatic],
        ['avatarLight', avatarLight],
        ['avatarDark', avatarDark],
      ]
      for (const [key, value] of pairs) {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        if (!res.ok) throw new Error('Ошибка сохранения')
      }
      showToast('Сохранено')
    } catch {
      showToast('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Личные данные</h2>
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Режим аватара</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="avatarMode"
              value="static"
              checked={avatarMode === 'static'}
              onChange={() => setAvatarMode('static')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Статичная</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="avatarMode"
              value="dynamic"
              checked={avatarMode === 'dynamic'}
              onChange={() => setAvatarMode('dynamic')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Динамическая</span>
          </label>
        </div>
      </div>

      {avatarMode === 'static' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Аватар</label>
          <AvatarUpload
            currentUrl={avatarStatic}
            onUpload={(e) => handleImageUpload(e, setAvatarStatic)}
            label="Загрузить аватар"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Аватар (светлая тема)
            </label>
            <AvatarUpload
              currentUrl={avatarLight}
              onUpload={(e) => handleImageUpload(e, setAvatarLight)}
              label="Загрузить для светлой"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Аватар (тёмная тема)
            </label>
            <AvatarUpload
              currentUrl={avatarDark}
              onUpload={(e) => handleImageUpload(e, setAvatarDark)}
              label="Загрузить для тёмной"
            />
          </div>
        </div>
      )}
    </section>
  )
}

/* ─────────── Section B: About Me ─────────── */

function AboutSection({ initialContent }: { initialContent: string }) {
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [preview, setPreview] = useState(initialContent)

  const activeEditor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      setPreview(ed.getHTML())
    },
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!activeEditor) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'aboutContent', value: activeEditor.getHTML() }),
      })
      if (!res.ok) throw new Error('Ошибка')
      showToast('Сохранено')
    } catch {
      showToast('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL изображения:')
    if (url && activeEditor) {
      activeEditor.chain().focus().setImage({ src: url }).run()
    }
  }, [activeEditor])

  const addLink = useCallback(() => {
    if (!activeEditor) return
    const previousUrl = activeEditor.getAttributes('link').href
    const url = window.prompt('URL ссылки:', previousUrl)
    if (url === null) return
    if (url === '') {
      activeEditor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      activeEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [activeEditor])

  if (!activeEditor) return null

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Обо мне</h2>
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

      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <div className="flex flex-wrap gap-1 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <ToolbarButton
              active={activeEditor.isActive('bold')}
              onClick={() => activeEditor.chain().focus().toggleBold().run()}
              title="Жирный"
            >
              B
            </ToolbarButton>
            <ToolbarButton
              active={activeEditor.isActive('italic')}
              onClick={() => activeEditor.chain().focus().toggleItalic().run()}
              title="Курсив"
            >
              <em>I</em>
            </ToolbarButton>
            <span className="w-px bg-gray-300 mx-1" />
            <ToolbarButton
              active={activeEditor.isActive('heading', { level: 2 })}
              onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="H2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              active={activeEditor.isActive('heading', { level: 3 })}
              onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="H3"
            >
              H3
            </ToolbarButton>
            <span className="w-px bg-gray-300 mx-1" />
            <ToolbarButton
              active={activeEditor.isActive('bulletList')}
              onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
              title="Список"
            >
              &bull;
            </ToolbarButton>
            <ToolbarButton
              active={activeEditor.isActive('orderedList')}
              onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
              title="Нумерованный"
            >
              1.
            </ToolbarButton>
            <span className="w-px bg-gray-300 mx-1" />
            <ToolbarButton active={activeEditor.isActive('link')} onClick={addLink} title="Ссылка">
              🔗
            </ToolbarButton>
            <ToolbarButton active={false} onClick={addImage} title="Изображение">
              🖼
            </ToolbarButton>
          </div>
          <EditorContent
            editor={activeEditor}
            className="prose prose-sm max-w-none min-h-[200px] border border-gray-200 rounded-lg p-4
              focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent
              [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
          />
        </div>

        {/* Live Preview */}
        <div>
          <div className="text-sm font-medium text-gray-500 mb-3">Предпросмотр</div>
          <div
            className="bg-[#1e2a3a] rounded-xl p-6 text-white prose prose-invert prose-sm max-w-none min-h-[240px]"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>
    </section>
  )
}

/* ─────────── Section C: Contacts ─────────── */

function ContactsSection({
  initialButtons,
  initialLinks,
}: {
  initialButtons: ContactButton[]
  initialLinks: SocialLink[]
}) {
  const [buttons, setButtons] = useState<ContactButton[]>(initialButtons)
  const [links, setLinks] = useState<SocialLink[]>(() => {
    // Ensure all 9 platforms exist
    const existing = new Map(initialLinks.map((l) => [l.platform, l]))
    return SOCIAL_PLATFORMS.map((p, i) => {
      const ex = existing.get(p.platform)
      return ex ?? { id: '', platform: p.platform, url: '', enabled: false, sortOrder: i }
    })
  })
  const [savingButtons, setSavingButtons] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [toastButtons, setToastButtons] = useState<string | null>(null)
  const [toastLinks, setToastLinks] = useState<string | null>(null)

  const showToast = (setter: (v: string | null) => void, msg: string) => {
    setter(msg)
    setTimeout(() => setter(null), 3000)
  }

  /* ── Buttons ── */

  const addButton = async () => {
    try {
      const res = await fetch('/api/contact-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Новая кнопка', url: '#', icon: 'link' }),
      })
      if (!res.ok) throw new Error()
      const btn = await res.json()
      setButtons((prev) => [...prev, btn])
    } catch {
      showToast(setToastButtons, 'Ошибка создания')
    }
  }

  const updateButton = (id: string, field: string, value: string) => {
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  const deleteButton = async (id: string) => {
    if (!confirm('Удалить кнопку?')) return
    try {
      await fetch(`/api/contact-buttons/${id}`, { method: 'DELETE' })
      setButtons((prev) => prev.filter((b) => b.id !== id))
    } catch {
      showToast(setToastButtons, 'Ошибка удаления')
    }
  }

  const saveButtons = async () => {
    setSavingButtons(true)
    try {
      for (const btn of buttons) {
        const res = await fetch(`/api/contact-buttons/${btn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: btn.label, url: btn.url, icon: btn.icon }),
        })
        if (!res.ok) throw new Error()
      }
      showToast(setToastButtons, 'Сохранено')
    } catch {
      showToast(setToastButtons, 'Ошибка сохранения')
    } finally {
      setSavingButtons(false)
    }
  }

  /* ── Social Links ── */

  const updateLink = (platform: string, field: string, value: string | boolean) => {
    setLinks((prev) => prev.map((l) => (l.platform === platform ? { ...l, [field]: value } : l)))
  }

  const saveLinks = async () => {
    setSavingLinks(true)
    try {
      const res = await fetch('/api/social-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: links.map((l) => ({ platform: l.platform, url: l.url, enabled: l.enabled })),
        }),
      })
      if (!res.ok) throw new Error()
      showToast(setToastLinks, 'Сохранено')
    } catch {
      showToast(setToastLinks, 'Ошибка сохранения')
    } finally {
      setSavingLinks(false)
    }
  }

  const platformLabel = (platform: string) =>
    SOCIAL_PLATFORMS.find((p) => p.platform === platform)?.label ?? platform

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Контакты</h2>
      </div>

      {/* Full-width buttons */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Кнопки действий
          </h3>
          <div className="flex items-center gap-2">
            {toastButtons && (
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                {toastButtons}
              </span>
            )}
            <Button onClick={saveButtons} disabled={savingButtons} size="sm">
              {savingButtons ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {buttons.map((btn) => (
            <div key={btn.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={btn.label}
                onChange={(e) => updateButton(btn.id, 'label', e.target.value)}
                placeholder="Текст кнопки"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
              <input
                type="text"
                value={btn.url}
                onChange={(e) => updateButton(btn.id, 'url', e.target.value)}
                placeholder="URL"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
              <select
                value={btn.icon}
                onChange={(e) => updateButton(btn.id, 'icon', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => deleteButton(btn.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addButton}
          className="mt-3 text-sm text-accent hover:underline font-medium"
        >
          + Добавить кнопку
        </button>
      </div>

      {/* Social links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Социальные сети
          </h3>
          <div className="flex items-center gap-2">
            {toastLinks && (
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                {toastLinks}
              </span>
            )}
            <Button onClick={saveLinks} disabled={savingLinks} size="sm">
              {savingLinks ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.platform} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  checked={link.enabled}
                  onChange={(e) => updateLink(link.platform, 'enabled', e.target.checked)}
                  className="accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  {platformLabel(link.platform)}
                </span>
              </label>
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLink(link.platform, 'url', e.target.value)}
                placeholder="URL"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────── Avatar Upload Zone ─────────── */

function AvatarUpload({
  currentUrl,
  onUpload,
  label,
}: {
  currentUrl: string
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="Аватар" className="w-full h-full object-cover rounded-full" />
        ) : (
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        )}
      </div>
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {label}
        <input
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
      </label>
    </div>
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
