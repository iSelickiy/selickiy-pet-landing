'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import RichTextEditor from '@/components/admin/RichTextEditor'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError, uploadImageWithProgress } from '@/lib/clientApi'

interface ContactButton { id?: string; label: string; url: string; icon: string; sortOrder: number; clientId?: string }
interface SocialLink { id: string; platform: string; url: string; enabled: boolean; sortOrder: number }
interface Props { settings: Record<string, string>; contactButtons: ContactButton[]; socialLinks: SocialLink[] }

const socialPlatforms = ['telegram', 'email', 'github', 'linkedin', 'instagram', 'vk', 'youtube', 'whatsapp', 'habr']

export default function ProfileEditor({ settings, contactButtons: initialButtons, socialLinks: initialLinks }: Props) {
  const [values, setValues] = useState({
    firstName: settings.firstName || '',
    lastName: settings.lastName || '',
    tagline: settings.tagline || 'Биздев — техноэнтузиаст',
    introText: settings.introText || 'Развиваю продажи, запускаю новые направления и иногда собираю веб‑проекты просто потому, что могу.',
    aboutContent: settings.aboutContent || '',
    avatarMode: settings.avatarMode || 'static',
    avatarStatic: settings.avatarStatic || settings.avatarUrl || '',
    avatarLight: settings.avatarLight || '',
    avatarDark: settings.avatarDark || '',
  })
  const [buttons, setButtons] = useState(initialButtons)
  const [links, setLinks] = useState(() => {
    const existing = new Map(initialLinks.map((item) => [item.platform, item]))
    return socialPlatforms.map((platform, index) => existing.get(platform) || { id: '', platform, url: '', enabled: false, sortOrder: index })
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const fullName = useMemo(() => `${values.firstName} ${values.lastName}`.trim() || 'Профиль', [values.firstName, values.lastName])

  const update = (key: keyof typeof values, value: string) => { setValues((current) => ({ ...current, [key]: value })); setDirty(true) }
  const save = async () => {
    setSaving(true); setMessage(null); setError(null)
    try {
      const responses = await Promise.all([
        fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: values }) }),
        fetch('/api/contact-buttons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buttons: buttons.map((button, index) => ({ id: button.id, label: button.label, url: button.url, icon: button.icon, sortOrder: index })) }) }),
        fetch('/api/social-links', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ links: links.map((link, index) => ({ platform: link.platform, url: link.url, enabled: link.enabled, sortOrder: index })) }) }),
      ])
      const failed = responses.find((response) => !response.ok)
      if (failed) throw new Error(await readApiError(failed, 'Не удалось сохранить профиль'))
      setDirty(false); setMessage('Изменения сохранены')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить профиль')
    } finally { setSaving(false) }
  }

  const upload = async (file: File) => {
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Аватар: JPEG, PNG, WebP, GIF или AVIF до 5 МБ'); return
    }
    try {
      setProgress(0)
      const result = await uploadImageWithProgress(file, setProgress)
      update('avatarStatic', result.url)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Не удалось загрузить аватар') }
    finally { setProgress(null) }
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="admin-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Имя" value={values.firstName} onChange={(event) => update('firstName', event.target.value)} />
            <Input label="Фамилия" value={values.lastName} onChange={(event) => update('lastName', event.target.value)} />
            <div className="sm:col-span-2"><Input label="Короткая роль" value={values.tagline} onChange={(event) => update('tagline', event.target.value)} /></div>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">Короткое описание
              <textarea value={values.introText} onChange={(event) => update('introText', event.target.value)} rows={3} className="admin-textarea mt-1" />
            </label>
          </div>
          <div className="rounded-2xl bg-[#0c223c] p-5 text-white">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
              {values.avatarStatic ? <Image src={values.avatarStatic} alt={fullName} fill sizes="80px" className="object-cover" /> : null}
            </div>
            <p className="mt-4 font-semibold">{fullName}</p>
            <p className="text-sm text-blue-300">{values.tagline}</p>
            <label className="focus-ring mt-5 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-white/15 px-3 text-sm hover:bg-white/10">
              Загрузить аватар<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} />
            </label>
            {progress !== null && <p className="mt-2 text-xs text-white/65">Загрузка: {progress}%</p>}
          </div>
        </div>
      </section>

      <section className="admin-card"><RichTextEditor label="Расширенное описание" value={values.aboutContent} onChange={(value) => update('aboutContent', value)} /></section>

      <section className="admin-card">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="admin-card-title">Контактные кнопки</h2><p className="admin-card-description">Дополнительные способы связаться с тобой.</p></div><Button type="button" size="sm" variant="secondary" onClick={() => { setButtons((current) => [...current, { clientId: crypto.randomUUID(), label: '', url: '', icon: 'link', sortOrder: current.length }]); setDirty(true) }}><Plus size={17} /> Добавить</Button></div>
        <div className="space-y-3">
          {buttons.map((button, index) => (
            <div key={button.id || button.clientId} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1.4fr_140px_44px]">
              <Input aria-label={`Название кнопки ${index + 1}`} placeholder="Название" value={button.label} onChange={(event) => { setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item)); setDirty(true) }} />
              <Input aria-label={`Ссылка кнопки ${index + 1}`} placeholder="https://…" value={button.url} onChange={(event) => { setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item)); setDirty(true) }} />
              <select aria-label={`Иконка кнопки ${index + 1}`} value={button.icon} onChange={(event) => { setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, icon: event.target.value } : item)); setDirty(true) }} className="admin-select"><option value="link">Ссылка</option><option value="message">Сообщение</option><option value="calendar">Календарь</option></select>
              <button type="button" onClick={() => { setButtons((current) => current.filter((_, itemIndex) => itemIndex !== index)); setDirty(true) }} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Удалить кнопку ${button.label || index + 1}`}><Trash size={19} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-card-title">Социальные ссылки</h2><p className="admin-card-description mb-5">Порядок совпадает с публичной страницей.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {links.map((link, index) => (
            <div key={link.platform} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="text-sm font-medium capitalize text-slate-700">{link.platform}</span>
              <Input aria-label={`Ссылка ${link.platform}`} value={link.url} onChange={(event) => { setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item)); setDirty(true) }} />
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={link.enabled} onChange={(event) => { setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item)); setDirty(true) }} /> Вкл.</label>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-savebar">
        <div><StatusMessage message={message} /><StatusMessage message={error} tone="error" />{dirty && !message && !error && <p className="text-sm text-amber-700">Есть несохранённые изменения</p>}</div>
        <Button type="button" onClick={() => void save()} disabled={saving || !dirty}>{saving ? 'Сохраняю…' : 'Сохранить всё'}</Button>
      </div>
    </div>
  )
}
