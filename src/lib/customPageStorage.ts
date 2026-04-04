import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'

const DEFAULT_CUSTOM_PAGES_DIR = path.join(process.cwd(), 'runtime', 'custom-pages')

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
}

function getCustomPagesDir() {
  return process.env.CUSTOM_PAGES_DIR?.trim() || DEFAULT_CUSTOM_PAGES_DIR
}

function resolveStoragePath(filename: string) {
  const baseDir = path.resolve(getCustomPagesDir())
  const filepath = path.resolve(baseDir, filename)

  if (!filepath.startsWith(baseDir + path.sep)) {
    throw new Error('Invalid custom page filename')
  }

  return { baseDir, filepath }
}

export function assertHtmlFile(file: File) {
  const filename = file.name.toLowerCase()
  if (!filename.endsWith('.html')) {
    throw new Error('Only .html files are allowed')
  }
}

export async function saveCustomPageFile(file: File) {
  assertHtmlFile(file)

  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const storedFile = `${uniquePrefix}-${sanitizeFilename(file.name)}`
  const { baseDir, filepath } = resolveStoragePath(storedFile)

  await mkdir(baseDir, { recursive: true })
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

  return {
    storedFile,
    originalName: file.name,
    size: file.size,
  }
}

export async function readCustomPageFile(storedFile: string) {
  const { filepath } = resolveStoragePath(storedFile)
  return await readFile(filepath, 'utf8')
}

export async function deleteCustomPageFile(storedFile: string) {
  const { filepath } = resolveStoragePath(storedFile)

  try {
    await unlink(filepath)
  } catch {
    // File may already be absent on disk.
  }
}
