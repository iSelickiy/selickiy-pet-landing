'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import RichTextEditor from '@/components/admin/RichTextEditor'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError } from '@/lib/clientApi'

interface Experience { id: string; company: string; position: string; periodFrom: string; periodTo: string; description: string; sortOrder: number }

export default function ResumeEditor({ experiences: initial, skillsContent: initialSkills }: { experiences: Experience[]; skillsContent: string }) {
  const [experiences, setExperiences] = useState(initial)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [skills, setSkills] = useState(initialSkills)
  const [skillsDirty, setSkillsDirty] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Experience | null>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)

  const update = (id: string, patch: Partial<Experience>) => {
    setExperiences((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
    setDirty((current) => new Set(current).add(id))
  }
  const add = () => {
    const id = `temp:${crypto.randomUUID()}`
    setExperiences((current) => [...current, { id, company: '', position: '', periodFrom: '', periodTo: '', description: '', sortOrder: current.length }])
    setDirty((current) => new Set(current).add(id))
  }
  const save = async (item: Experience) => {
    setSaving(item.id); setStatus(null)
    try {
      const temporary = item.id.startsWith('temp:')
      const response = await fetch(temporary ? '/api/resume' : `/api/resume/${item.id}`, {
        method: temporary ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: item.company, position: item.position, periodFrom: item.periodFrom, periodTo: item.periodTo, description: item.description, sortOrder: item.sortOrder }),
      })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось сохранить запись'))
      const saved = await response.json()
      setExperiences((current) => current.map((experience) => experience.id === item.id ? saved : experience))
      setDirty((current) => { const next = new Set(current); next.delete(item.id); return next })
      setStatus({ message: 'Запись сохранена' })
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка сохранения', error: true }) }
    finally { setSaving(null) }
  }
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= experiences.length) return
    const previous = experiences
    const reordered = [...experiences]
    const [item] = reordered.splice(index, 1)
    reordered.splice(target, 0, item)
    setExperiences(reordered)
    try {
      const response = await fetch('/api/resume/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: reordered.filter((entry) => !entry.id.startsWith('temp:')).map((entry) => entry.id) }) })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось изменить порядок'))
    } catch (caught) { setExperiences(previous); setStatus({ message: caught instanceof Error ? caught.message : 'Порядок восстановлен', error: true }) }
  }
  const remove = async () => {
    if (!deleting) return
    const item = deleting
    if (item.id.startsWith('temp:')) { setExperiences((current) => current.filter((entry) => entry.id !== item.id)); setDeleting(null); return }
    setSaving(item.id)
    try {
      const response = await fetch(`/api/resume/${item.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось удалить запись'))
      setExperiences((current) => current.filter((entry) => entry.id !== item.id)); setDeleting(null)
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка удаления', error: true }) }
    finally { setSaving(null) }
  }
  const saveSkills = async () => {
    setSaving('skills'); setStatus(null)
    try {
      const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'skills', content: skills }) })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось сохранить навыки'))
      setSkillsDirty(false); setStatus({ message: 'Навыки сохранены' })
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка сохранения', error: true }) }
    finally { setSaving(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><StatusMessage message={status?.message || null} tone={status?.error ? 'error' : 'success'} /><Button type="button" onClick={add}><Plus size={18} /> Добавить место</Button></div>
      <div className="space-y-4">
        {experiences.map((item, index) => (
          <section key={item.id} className="admin-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">{item.position || 'Новое место работы'}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label="Переместить выше"><ArrowUp size={19} /></button>
                <button type="button" onClick={() => void move(index, 1)} disabled={index === experiences.length - 1} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label="Переместить ниже"><ArrowDown size={19} /></button>
                <button type="button" onClick={() => setDeleting(item)} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label="Удалить место работы"><Trash size={19} /></button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Компания" value={item.company} onChange={(event) => update(item.id, { company: event.target.value })} />
              <Input label="Должность" value={item.position} onChange={(event) => update(item.id, { position: event.target.value })} />
              <Input label="Начало" value={item.periodFrom} onChange={(event) => update(item.id, { periodFrom: event.target.value })} />
              <Input label="Окончание" value={item.periodTo} onChange={(event) => update(item.id, { periodTo: event.target.value })} />
              <div className="sm:col-span-2"><RichTextEditor label="Что делал, за что отвечал и чему научился" value={item.description} onChange={(value) => update(item.id, { description: value })} /></div>
            </div>
            <div className="mt-4 flex justify-end"><Button type="button" onClick={() => void save(item)} disabled={!dirty.has(item.id) || saving === item.id}>{saving === item.id ? 'Сохраняю…' : 'Сохранить запись'}</Button></div>
          </section>
        ))}
      </div>
      <section className="admin-card">
        <RichTextEditor label="Навыки и инструменты" value={skills} onChange={(value) => { setSkills(value); setSkillsDirty(true) }} />
        <div className="mt-4 flex justify-end"><Button type="button" onClick={() => void saveSkills()} disabled={!skillsDirty || saving === 'skills'}>{saving === 'skills' ? 'Сохраняю…' : 'Сохранить навыки'}</Button></div>
      </section>
      <ConfirmDialog open={Boolean(deleting)} title="Удалить запись из резюме?" description={deleting ? `${deleting.position || 'Запись'} · ${deleting.company || 'без компании'}` : ''} busy={saving === deleting?.id} onClose={() => setDeleting(null)} onConfirm={() => void remove()} />
    </div>
  )
}
