'use client'

import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'

interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

interface MediaLibraryProps {
  initialFiles: MediaFile[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibrary({ initialFiles }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const newFile = await res.json()
          setFiles((prev) => [newFile, ...prev])
        }
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Удалить файл "${file.originalName}"?`)) return
    const res = await fetch(`/api/upload/${file.filename}`, { method: 'DELETE' })
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Медиа библиотека</h1>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleUpload(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6
          border-gray-300 hover:border-accent hover:bg-accent/5
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <p className="text-gray-500">
          {uploading ? 'Загрузка...' : 'Нажмите или перетащите файлы для загрузки'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Grid */}
      {files.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Файлов пока нет</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
            >
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(file)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate">{file.originalName}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
