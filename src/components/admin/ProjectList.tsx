'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeSlash, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError } from '@/lib/clientApi'

interface Project { id: string; title: string; slug: string; description: string; previewUrl: string | null; techStack: string[]; status: 'DRAFT' | 'PUBLISHED'; stage: string; cardType: string; externalUrl: string | null; sortOrder: number }

export default function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null)

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= projects.length) return
    const previous = projects
    const next = [...projects]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setProjects(next); setStatus(null)
    try {
      const response = await fetch('/api/projects/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: next.map((project) => project.id) }) })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось изменить порядок'))
    } catch (caught) { setProjects(previous); setStatus({ message: caught instanceof Error ? caught.message : 'Порядок восстановлен', error: true }) }
  }
  const togglePublish = async (project: Project) => {
    setBusy(project.id); setStatus(null)
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: project.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }) })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось изменить статус'))
      const updated = await response.json()
      setProjects((current) => current.map((item) => item.id === project.id ? updated : item))
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка статуса', error: true }) }
    finally { setBusy(null) }
  }
  const remove = async () => {
    if (!deleting) return
    setBusy(deleting.id)
    try {
      const response = await fetch(`/api/projects/${deleting.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось удалить проект'))
      setProjects((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null)
    } catch (caught) { setStatus({ message: caught instanceof Error ? caught.message : 'Ошибка удаления', error: true }) }
    finally { setBusy(null) }
  }

  return (
    <div>
      <PageHeader title="Проекты" description="Одна живая лента: готовые вещи, прототипы и идеи на паузе." action={<Link href="/admin/projects/new" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Новый проект</Link>} />
      <StatusMessage message={status?.message || null} tone={status?.error ? 'error' : 'success'} />
      <div className="mt-4 space-y-3">
        {projects.map((project, index) => (
          <article key={project.id} className="admin-card flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex gap-1 md:flex-col">
              <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label={`Переместить ${project.title} выше`}><ArrowUp size={19} /></button>
              <button type="button" onClick={() => void move(index, 1)} disabled={index === projects.length - 1} className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label={`Переместить ${project.title} ниже`}><ArrowDown size={19} /></button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{project.title}</h2><span className={`rounded-full px-2 py-1 text-xs font-medium ${project.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{project.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}</span><span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{project.stage}</span></div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">{project.techStack.map((tech) => <span key={tech} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{tech}</span>)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void togglePublish(project)} disabled={busy === project.id} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{project.status === 'PUBLISHED' ? <EyeSlash size={18} /> : <Eye size={18} />}{project.status === 'PUBLISHED' ? 'В черновик' : 'Опубликовать'}</button>
              <Link href={`/admin/projects/${project.id}`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><PencilSimple size={18} /> Изменить</Link>
              <Button type="button" variant="danger" onClick={() => setDeleting(project)} aria-label={`Удалить ${project.title}`}><Trash size={18} /></Button>
            </div>
          </article>
        ))}
        {!projects.length && <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Проектов пока нет — можно начать с маленького эксперимента.</p>}
      </div>
      <ConfirmDialog open={Boolean(deleting)} title="Удалить проект?" description={deleting ? `«${deleting.title}» будет удалён без возможности восстановления.` : ''} busy={busy === deleting?.id} onClose={() => setDeleting(null)} onConfirm={() => void remove()} />
    </div>
  )
}
