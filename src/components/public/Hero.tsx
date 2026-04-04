import RichContent from '@/components/ui/RichContent'

interface HeroProps {
  content: string
}

export default function Hero({ content }: HeroProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-28 h-28 mx-auto mb-8 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center">
          <span className="text-3xl font-bold text-accent">ИС</span>
        </div>
        <div className="text-lg md:text-xl">
          <RichContent html={content} />
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="#projects"
            className="inline-flex items-center px-6 py-3 rounded-full bg-accent text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Смотреть проекты
          </a>
          <a
            href="#contacts"
            className="inline-flex items-center px-6 py-3 rounded-full border border-border-theme text-text-secondary font-medium text-sm hover:border-text-secondary/30 transition-colors"
          >
            Связаться
          </a>
        </div>
      </div>
    </section>
  )
}
