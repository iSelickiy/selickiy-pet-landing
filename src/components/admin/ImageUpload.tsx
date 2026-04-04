'use client'

import { useState, useRef, DragEvent } from 'react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onChange(data.url)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) upload(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <p className="text-sm text-gray-500">Загрузка...</p>
        ) : (
          <p className="text-sm text-gray-500">
            Нажмите или перетащите изображение
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="w-full max-w-xs rounded-lg border border-gray-200 object-cover"
          />
        </div>
      )}
    </div>
  )
}
