import Link from 'next/link'
import { ArrowRight, FileHtml, Flask } from '@phosphor-icons/react/dist/ssr'

interface LaboratoryProps {
  pages: Array<{
    id: string
    title: string
    slug: string
    folder: string
    tags: string[]
    updatedAt: Date
  }>
}

export default function Laboratory({ pages }: LaboratoryProps) {
  return (
    <section id="laboratory" aria-labelledby="laboratory-title" className="scroll-mt-28 border-t border-border-theme pt-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Последние артефакты</p>
          <h2 id="laboratory-title">Лаборатория</h2>
        </div>
        <Flask size={24} className="text-accent" aria-hidden="true" />
      </div>
      {pages.length ? (
        <div className="artifact-scroll">
          {pages.map((page) => (
            <Link key={page.id} href={`/custom/${page.slug}`} className="artifact-card focus-ring">
              <span className="flex items-center justify-between gap-3 text-xs text-text-secondary">
                <span>{page.updatedAt.toLocaleDateString('ru-RU')}</span>
                <FileHtml size={18} aria-hidden="true" />
              </span>
              <span className="mt-4 block text-sm font-semibold leading-5 text-text-primary">{page.title}</span>
              <span className="mt-2 flex items-center gap-1 text-xs text-accent">
                {page.folder || page.tags[0] || 'custom page'} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">Здесь будут заметки, прототипы, шаблоны и странные веб‑штуки.</p>
      )}
      <p className="mt-4 text-xs text-text-secondary">Живой журнал: здесь могут быть и законченные вещи, и черновики.</p>
    </section>
  )
}
