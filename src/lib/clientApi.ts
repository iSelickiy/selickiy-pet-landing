export async function readApiError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return body?.error?.message || body?.error || fallback
  } catch {
    return fallback
  }
}

export function uploadImageWithProgress(file: File, onProgress: (progress: number) => void) {
  return new Promise<{ url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.responseType = 'json'
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response)
      else reject(new Error(xhr.response?.error?.message || 'Не удалось загрузить файл'))
    })
    xhr.addEventListener('error', () => reject(new Error('Сеть недоступна')))
    const data = new FormData()
    data.append('file', file)
    xhr.send(data)
  })
}
