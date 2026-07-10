import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import { prisma } from '@/lib/prisma'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ALLOWED_UPLOAD_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
])

export function getUploadsDir() {
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'runtime', 'uploads'))
}

export function resolveUploadPath(filename: string) {
  if (filename !== path.basename(filename) || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename')
  }
  const baseDir = getUploadsDir()
  const filepath = path.resolve(/* turbopackIgnore: true */ baseDir, filename)
  if (!filepath.startsWith(`${baseDir}${path.sep}`)) throw new Error('Invalid filename')
  return { baseDir, filepath }
}

export async function validateImageFile(file: File) {
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Image must be smaller than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)
  if (!detected || !ALLOWED_UPLOAD_TYPES.has(detected.mime)) {
    throw new Error('Only JPEG, PNG, WebP, GIF and AVIF images are allowed')
  }

  return { buffer, mimeType: detected.mime, extension: ALLOWED_UPLOAD_TYPES.get(detected.mime)! }
}

export async function saveFile(file: File) {
  const { buffer, mimeType, extension } = await validateImageFile(file)
  const baseDir = getUploadsDir()
  await mkdir(baseDir, { recursive: true })

  const filename = `${Date.now()}-${randomUUID()}.${extension}`
  const { filepath } = resolveUploadPath(filename)
  await writeFile(filepath, buffer, { flag: 'wx' })

  try {
    const record = await prisma.mediaFile.create({
      data: {
        filename,
        originalName: file.name.slice(0, 240),
        mimeType,
        size: buffer.length,
        url: `/uploads/${filename}`,
      },
    })
    return record
  } catch (error) {
    await unlink(filepath).catch(() => undefined)
    throw error
  }
}

export async function readUpload(filename: string) {
  const { filepath } = resolveUploadPath(filename)
  const record = await prisma.mediaFile.findUnique({ where: { filename } })
  if (!record) return null
  const buffer = await readFile(/* turbopackIgnore: true */ filepath)
  return { buffer, record }
}

export async function deleteFile(filename: string) {
  const { filepath } = resolveUploadPath(filename)
  const record = await prisma.mediaFile.findUnique({ where: { filename } })
  if (!record) return false

  const quarantine = `${filepath}.deleting-${randomUUID()}`
  let moved = false
  try {
    await rename(filepath, quarantine)
    moved = true
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    if (code !== 'ENOENT') throw error
  }

  try {
    await prisma.mediaFile.delete({ where: { filename } })
  } catch (error) {
    if (moved) await rename(quarantine, filepath).catch(() => undefined)
    throw error
  }

  if (moved) await unlink(quarantine).catch((error) => console.error('Failed to remove quarantined upload', error))
  return true
}
