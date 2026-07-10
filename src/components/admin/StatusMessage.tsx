export default function StatusMessage({ message, tone = 'success' }: { message: string | null; tone?: 'success' | 'error' }) {
  if (!message) return null
  return <p role="status" aria-live="polite" className={`text-sm ${tone === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{message}</p>
}
