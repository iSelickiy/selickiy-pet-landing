'use client'

import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} onCancel={(event) => { event.preventDefault(); onClose() }} onClose={onClose} className="m-auto w-[min(92vw,440px)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-950/55">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Отмена</Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Подождите…' : confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  )
}
