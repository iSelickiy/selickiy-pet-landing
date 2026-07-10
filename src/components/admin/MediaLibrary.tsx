'use client'

import Image from 'next/image'
import { DragEvent, useState } from 'react'
import { Copy, Trash, UploadSimple } from '@phosphor-icons/react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import PageHeader from '@/components/admin/PageHeader'
import StatusMessage from '@/components/admin/StatusMessage'
import { readApiError, uploadImageWithProgress } from '@/lib/clientApi'

interface MediaFile { id: string; filename: string; originalName: string; mimeType: string; size: number; url: string; createdAt: string }
interface QueueItem { name: string; progress: number; error?: string }

export default function MediaLibrary({ initialFiles }: { initialFiles: MediaFile[] }) {
  const [files, setFiles] = useState(initialFiles)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState<MediaFile | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = async (selected: File[]) => {
    const accepted = selected.filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) && file.size <= 5 * 1024 * 1024)
    const rejected = selected.filter((file) => !accepted.includes(file))
    setQueue([...accepted.map((file) => ({ name: file.name, progress: 0 })), ...rejected.map((file) => ({ name: file.name, progress: 0, error: 'Нужен JPEG, PNG, WebP, GIF или AVIF до 5 МБ' }))])
    for (const file of accepted) {
      try {
        const result = await uploadImageWithProgress(file, (progress) => setQueue((current) => current.map((item) => item.name === file.name ? { ...item, progress } : item)))
        const response = await fetch('/api/upload')
        if (response.ok) setFiles(await response.json())
        else setFiles((current) => [{ id: crypto.randomUUID(), filename: result.url.split('/').pop() || '', originalName: file.name, mimeType: file.type, size: file.size, url: result.url, createdAt: new Date().toISOString() }, ...current])
      } catch (caught) {
        setQueue((current) => current.map((item) => item.name === file.name ? { ...item, error: caught instanceof Error ? caught.message : 'Ошибка загрузки' } : item))
      }
    }
  }
  const drop = (event: DragEvent) => { event.preventDefault(); setDragging(false); void upload(Array.from(event.dataTransfer.files)) }
  const remove = async () => {
    if (!deleting) return
    setBusy(true); setError(null)
    try {
      const response = await fetch(`/api/upload/${encodeURIComponent(deleting.filename)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await readApiError(response, 'Не удалось удалить файл'))
      setFiles((current) => current.filter((file) => file.id !== deleting.id)); setDeleting(null)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Ошибка удаления') }
    finally { setBusy(false) }
  }
  const copy = async (url: string) => { await navigator.clipboard.writeText(url); setMessage('Ссылка скопирована'); setTimeout(() => setMessage(null), 2200) }

  return (
    <div>
      <PageHeader title="Медиа" description="Изображения хранятся вне git и доступны по неизменяемым ссылкам /uploads/…." />
      <label onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={drop} className={`focus-ring flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'}`}>
        <UploadSimple size={34} className="text-blue-600" /><span className="mt-3 font-semibold text-slate-800">Перетащи изображения или выбери файлы</span><span className="mt-1 text-sm text-slate-500">JPEG, PNG, WebP, GIF, AVIF · до 5 МБ каждый</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => void upload(Array.from(event.target.files || []))} />
      </label>
      {queue.length > 0 && <div className="mt-4 space-y-2" aria-live="polite">{queue.map((item) => <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-3 text-sm"><div className="flex justify-between gap-4"><span className="truncate">{item.name}</span><span className={item.error ? 'text-red-600' : 'text-slate-500'}>{item.error || `${item.progress}%`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${item.error ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${item.error ? 100 : item.progress}%` }} /></div></div>)}</div>}
      <div className="mt-5"><StatusMessage message={message} /><StatusMessage message={error} tone="error" /></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <article key={file.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative aspect-video bg-slate-100"><Image src={file.url} alt={file.originalName} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div>
            <div className="p-4"><p className="truncate text-sm font-semibold text-slate-800" title={file.originalName}>{file.originalName}</p><p className="mt-1 text-xs text-slate-500">{Math.round(file.size / 1024)} КБ · {file.mimeType}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => void copy(file.url)} className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"><Copy size={18} /> Копировать</button><Button type="button" variant="danger" onClick={() => setDeleting(file)} aria-label={`Удалить ${file.originalName}`}><Trash size={18} /></Button></div></div>
          </article>
        ))}
      </div>
      {!files.length && <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Медиатека пока пуста.</p>}
      <ConfirmDialog open={Boolean(deleting)} title="Удалить изображение?" description={deleting ? `«${deleting.originalName}» перестанет открываться по текущей ссылке.` : ''} busy={busy} onClose={() => setDeleting(null)} onConfirm={() => void remove()} />
    </div>
  )
}
