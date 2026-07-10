import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_CUSTOM_PAGES_DIR = path.join(process.cwd(), 'runtime', 'custom-pages')
export const MAX_CUSTOM_PAGE_BYTES = 5 * 1024 * 1024

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(0, 180)
}

export function getCustomPagesDir() {
  return path.resolve(/* turbopackIgnore: true */ process.env.CUSTOM_PAGES_DIR?.trim() || DEFAULT_CUSTOM_PAGES_DIR)
}

function resolveStoragePath(filename: string) {
  if (filename !== path.basename(filename)) throw new Error('Invalid custom page filename')
  const baseDir = getCustomPagesDir()
  const filepath = path.resolve(/* turbopackIgnore: true */ baseDir, filename)
  if (!filepath.startsWith(`${baseDir}${path.sep}`)) throw new Error('Invalid custom page filename')
  return { baseDir, filepath }
}

export async function validateHtmlFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.html')) throw new Error('Only .html files are allowed')
  if (file.size <= 0 || file.size > MAX_CUSTOM_PAGE_BYTES) {
    throw new Error(`HTML file must be smaller than ${MAX_CUSTOM_PAGE_BYTES / 1024 / 1024} MB`)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const content = buffer.toString('utf8')
  if (content.includes('\0') || !/<(?:!doctype|html|head|body|main|div|section|style|script)\b/i.test(content)) {
    throw new Error('The file does not look like valid HTML')
  }
  return buffer
}

export async function saveCustomPageFile(file: File) {
  const buffer = await validateHtmlFile(file)
  const storedFile = `${Date.now()}-${randomUUID()}-${sanitizeFilename(file.name)}`
  const { baseDir, filepath } = resolveStoragePath(storedFile)
  await mkdir(baseDir, { recursive: true })
  await writeFile(filepath, buffer, { flag: 'wx' })
  return { storedFile, originalName: file.name.slice(0, 240), size: buffer.length }
}

export async function readCustomPageFile(storedFile: string) {
  return readFile(/* turbopackIgnore: true */ resolveStoragePath(storedFile).filepath, 'utf8')
}

export async function deleteCustomPageFile(storedFile: string) {
  await unlink(resolveStoragePath(storedFile).filepath).catch((error) => {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    if (code !== 'ENOENT') throw error
  })
}

export async function quarantineCustomPageFile(storedFile: string) {
  const { filepath } = resolveStoragePath(storedFile)
  const quarantine = `${filepath}.deleting-${randomUUID()}`
  try {
    await rename(filepath, quarantine)
    return {
      restore: () => rename(quarantine, filepath),
      remove: () => unlink(quarantine).catch(() => undefined),
    }
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined
    if (code !== 'ENOENT') throw error
    return { restore: async () => undefined, remove: async () => undefined }
  }
}
