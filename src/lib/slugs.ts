import slugify from 'slugify'

export function normalizeSlug(input: string, fallback = 'item') {
  return slugify(input, { lower: true, strict: true, trim: true }) || fallback
}

export async function resolveUniqueSlug(
  input: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallback = 'item',
) {
  const base = normalizeSlug(input, fallback)
  let candidate = base
  let counter = 2
  while (await isTaken(candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  return candidate
}
