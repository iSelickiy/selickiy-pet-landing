import RichContent from '@/components/ui/RichContent'

interface AboutProps {
  content: string
}

export default function About({ content }: AboutProps) {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-text-primary mb-8">Обо мне</h2>
        <div className="bg-card-bg rounded-2xl border border-border-theme p-8 md:p-10 shadow-sm">
          <RichContent html={content} />
        </div>
      </div>
    </section>
  )
}
