import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from './prisma'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
}

export async function saveFile(file: File): Promise<{
  filename: string
  url: string
  originalName: string
  mimeType: string
  size: number
}> {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const sanitized = sanitizeFilename(file.name)
  const filename = `${uniquePrefix}-${sanitized}`
  const filepath = path.join(UPLOAD_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  const url = `/uploads/${filename}`

  await prisma.mediaFile.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
    },
  })

  return { filename, url, originalName: file.name, mimeType: file.type, size: file.size }
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename)
  if (!filepath.startsWith(UPLOAD_DIR + path.sep)) {
    throw new Error('Invalid filename')
  }
  try {
    await unlink(filepath)
  } catch {
    // file may not exist on disk, continue with DB cleanup
  }
  await prisma.mediaFile.delete({ where: { filename } })
}
