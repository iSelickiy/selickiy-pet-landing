import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
async function main() {
  // Upsert content sections
  await prisma.contentSection.upsert({
    where: { key: 'hero' },
    update: {},
    create: {
      key: 'hero',
      content: `<h1>Игорь Селицкий</h1><p>Менеджер по развитию бизнеса в <strong>Mindbox</strong>. Строю мосты между бизнесом и технологиями — помогаю компаниям расти через CRM, программы лояльности и автоматизацию маркетинга.</p><p>А ещё делаю полезные штуки для коллег и клиентов.</p>`,
    },
  })

  await prisma.contentSection.upsert({
    where: { key: 'about' },
    update: {},
    create: {
      key: 'about',
      content: `<p>Более 11 лет в digital-сфере. Начинал с SMM и маркетинга, вырос до менеджера по развитию бизнеса в одной из ведущих martech-компаний России.</p><p><strong>Чем занимаюсь:</strong></p><ul><li>Расширяю партнёрский портфель и развиваю текущую базу через допродажи</li><li>Сопровождал запуск 7 программ лояльности, включая розничную сеть на 800+ магазинов</li><li>Вёл до 13 клиентов с суммарной подпиской более 70 млн ₽ в год</li><li>Строю менеджерские и сейлзовые команды</li></ul><p>С детства увлекаюсь технологиями — от создания игровых серверов до видеомонтажа и программирования. Сейчас активно занимаюсь вайб-кодингом: создаю pet-проекты и утилиты для коллег и клиентов.</p><p>В свободное время — горные лыжи, теннис, путешествия и поиск вкусных мест.</p>`,
    },
  })

  await prisma.contentSection.upsert({
    where: { key: 'resume' },
    update: {},
    create: {
      key: 'resume',
      content: `<h3>Опыт работы</h3>
<h4>Mindbox — Менеджер по развитию бизнеса</h4>
<p><em>Февраль 2025 — настоящее время</em></p>
<ul>
<li>Расширение и развитие партнёрского портфеля</li>
<li>Развитие текущей базы через допродажи дополнительного функционала</li>
<li>Создание и ведение воронки допродаж</li>
</ul>

<h4>Mindbox — Customer Success Manager</h4>
<p><em>Апрель 2022 — Февраль 2025 (2 года 11 месяцев)</em></p>
<ul>
<li>Вёл до 13 клиентов с суммарной подпиской более 70 млн ₽ в год</li>
<li>UPsale дополнительных модулей</li>
<li>Технический и бизнесовый запуск Программы лояльности в розничной сети на 800+ офлайн магазинов</li>
<li>Разработка CRM стратегии</li>
<li>Антикризис менеджмент</li>
<li>Расчёт окупаемости и сопровождение клиентов</li>
</ul>

<h4>Mindbox — Младший менеджер проектов</h4>
<p><em>Июнь 2021 — Апрель 2022 (11 месяцев)</em></p>
<ul>
<li>Работа в чате — помощь клиентам в решении задач</li>
<li>Обучение работе с платформой</li>
<li>Настройка и запуск цепочек коммуникаций</li>
<li>Разработка медиаплана, отстройка рассылок</li>
</ul>

<h4>VAPETIGER — Специалист по маркетингу / Руководитель отдела продаж</h4>
<p><em>Август 2016 — Май 2021 (4 года 10 месяцев)</em></p>
<ul>
<li>Управление интернет-магазином и онлайн-прайсом</li>
<li>SMM (VK, Instagram, Telegram)</li>
<li>Полный контроль и ведение на маркетплейсах (Ozon, WB, Яндекс)</li>
<li>Переговоры с иностранными партнёрами (Китай, США)</li>
<li>Email-маркетинг, создание и ведение отдела торговых представителей</li>
</ul>

<h3>Навыки</h3>
<p>CRM-маркетинг, B2B/B2C продажи, Программы лояльности, Email-маркетинг, Маркетинговая аналитика, Медиапланирование, Ведение переговоров, Python, HTML, Google Analytics</p>

<h3>Образование и сертификаты</h3>
<ul>
<li>Генеративный AI для продакт-менеджеров — мини-симулятор (2025)</li>
<li>Илья Синельников: «Переговоры и отношения с клиентами» (2022)</li>
</ul>`,
    },
  })

  await prisma.contentSection.upsert({
    where: { key: 'contacts' },
    update: {},
    create: {
      key: 'contacts',
      content: `<ul>
<li><strong>Telegram:</strong> <a href="https://t.me/iselickiy">@iselickiy</a></li>
<li><strong>Email:</strong> <a href="mailto:i.selickiy@yandex.ru">i.selickiy@yandex.ru</a></li>
<li><strong>Instagram:</strong> <a href="https://www.instagram.com/iselickiy">@iselickiy</a></li>
<li><strong>Calendly:</strong> <a href="https://calendly.com">Забронировать встречу</a></li>
</ul>`,
    },
  })

  // Projects
  await prisma.project.upsert({
    where: { slug: 'crm-roi-calculator' },
    update: {},
    create: {
      title: 'CRM ROI Калькулятор',
      slug: 'crm-roi-calculator',
      description: 'Утилита для расчёта окупаемости CRM-платформы. Помогает клиентам быстро оценить эффект от внедрения автоматизации маркетинга.',
      techStack: JSON.stringify(['Next.js', 'React', 'Tailwind CSS']),
      status: 'PUBLISHED',
      cardType: 'DETAIL_PAGE',
      pageContent: `<h2>CRM ROI Калькулятор</h2>
<p>Инструмент, который помогает бизнесу оценить возврат инвестиций от внедрения CRM-платформы.</p>
<h3>Как работает</h3>
<ul>
<li>Вводите текущие показатели: базу клиентов, средний чек, частоту покупок</li>
<li>Указываете стоимость CRM-платформы</li>
<li>Получаете расчёт ROI с разбивкой по месяцам</li>
</ul>
<h3>Зачем</h3>
<p>Создал для себя и коллег — часто нужно быстро показать клиенту, что автоматизация маркетинга окупится. Раньше считали в Excel, теперь — за 2 минуты в браузере.</p>`,
      sortOrder: 0,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'loyalty-program-launcher' },
    update: {},
    create: {
      title: 'Чек-лист запуска программы лояльности',
      slug: 'loyalty-program-launcher',
      description: 'Интерактивный чек-лист для бизнеса: все этапы запуска программы лояльности от стратегии до go-live.',
      techStack: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS']),
      status: 'PUBLISHED',
      cardType: 'DETAIL_PAGE',
      pageContent: `<h2>Чек-лист запуска программы лояльности</h2>
<p>Пошаговый интерактивный чек-лист, основанный на опыте запуска 7 программ лояльности.</p>
<h3>Что внутри</h3>
<ul>
<li>Этап стратегии: определение целей, метрик, механики</li>
<li>Техническая подготовка: интеграции, тестирование</li>
<li>Go-live: пилот, масштабирование, мониторинг</li>
</ul>
<p>Каждый пункт можно отмечать как выполненный — прогресс сохраняется в браузере.</p>`,
      sortOrder: 1,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'email-template-builder' },
    update: {},
    create: {
      title: 'Email Template Builder',
      slug: 'email-template-builder',
      description: 'Конструктор email-шаблонов для маркетологов. Drag & drop интерфейс, экспорт в HTML.',
      techStack: JSON.stringify(['Next.js', 'DnD Kit', 'Tailwind CSS']),
      status: 'PUBLISHED',
      cardType: 'EXTERNAL_LINK',
      externalUrl: 'https://github.com/selickiy',
      sortOrder: 2,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'sales-dashboard' },
    update: {},
    create: {
      title: 'Sales Pipeline Dashboard',
      slug: 'sales-dashboard',
      description: 'Дашборд для визуализации воронки продаж. Интеграция с CRM, автоматические отчёты.',
      techStack: JSON.stringify(['React', 'Chart.js', 'PostgreSQL']),
      status: 'PUBLISHED',
      cardType: 'EXTERNAL_LINK',
      externalUrl: 'https://github.com/selickiy',
      sortOrder: 3,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'onboarding-bot' },
    update: {},
    create: {
      title: 'Onboarding-бот для новых клиентов',
      slug: 'onboarding-bot',
      description: 'Telegram-бот, который проводит нового клиента через первые шаги настройки CRM-платформы. Интерактивные подсказки и чек-листы.',
      techStack: JSON.stringify(['Python', 'Telegram API', 'PostgreSQL']),
      status: 'PUBLISHED',
      cardType: 'DETAIL_PAGE',
      pageContent: `<h2>Onboarding-бот для новых клиентов</h2>
<p>Telegram-бот, который автоматизирует первые шаги нового клиента на CRM-платформе.</p>
<h3>Что умеет</h3>
<ul>
<li>Пошаговый onboarding: от регистрации до первой рассылки</li>
<li>Интерактивные чек-листы с прогрессом</li>
<li>FAQ по частым вопросам</li>
<li>Эскалация на менеджера при сложных вопросах</li>
</ul>
<p>Идея родилась из наблюдения: 70% вопросов новых клиентов одинаковые. Бот снимает нагрузку с команды поддержки.</p>`,
      sortOrder: 4,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'ab-test-calculator' },
    update: {},
    create: {
      title: 'A/B Test Калькулятор',
      slug: 'ab-test-calculator',
      description: 'Быстрый расчёт статистической значимости A/B тестов. Определяет нужный размер выборки и длительность теста.',
      techStack: JSON.stringify(['React', 'TypeScript', 'Statistics']),
      status: 'PUBLISHED',
      cardType: 'EXTERNAL_LINK',
      externalUrl: 'https://github.com/selickiy',
      sortOrder: 5,
    },
  })

  await prisma.project.upsert({
    where: { slug: 'client-health-score' },
    update: {},
    create: {
      title: 'Client Health Score',
      slug: 'client-health-score',
      description: 'Система скоринга здоровья клиентской базы. Предсказывает отток и подсвечивает клиентов, требующих внимания.',
      techStack: JSON.stringify(['Python', 'Pandas', 'Next.js']),
      status: 'PUBLISHED',
      cardType: 'DETAIL_PAGE',
      pageContent: `<h2>Client Health Score</h2>
<p>Инструмент для Customer Success менеджеров: автоматический мониторинг «здоровья» клиентов.</p>
<h3>Как работает</h3>
<ul>
<li>Собирает данные об активности клиента: логины, использование фич, обращения в поддержку</li>
<li>Рассчитывает Health Score по 100-балльной шкале</li>
<li>Красная зона (0-40): требует немедленного внимания</li>
<li>Жёлтая зона (40-70): плановый чекап</li>
<li>Зелёная зона (70-100): всё хорошо</li>
</ul>
<p>Помог предотвратить 3 оттока за первый квартал использования.</p>`,
      sortOrder: 6,
    },
  })

  // === Site Settings ===
  const settings = [
    { key: 'firstName', value: 'Игорь' },
    { key: 'lastName', value: 'Селицкий' },
    { key: 'avatarUrl', value: '' },
    { key: 'avatarMode', value: 'static' },
    { key: 'avatarDarkUrl', value: '' },
    { key: 'aboutContent', value: '<p>Менеджер по развитию бизнеса в Mindbox. Строю мосты между бизнесом и технологиями — помогаю компаниям расти через CRM, программы лояльности и автоматизацию маркетинга.</p><p>А ещё делаю полезные штуки для коллег и клиентов.</p>' },
  ]
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  // === Resume Experience ===
  const experiences = [
    {
      company: 'Mindbox',
      position: 'Менеджер по развитию бизнеса',
      periodFrom: 'Февраль 2025',
      periodTo: 'настоящее время',
      description: '<ul><li>Расширение и развитие партнёрского портфеля</li><li>Развитие текущей базы через допродажи дополнительного функционала</li><li>Создание и ведение воронки допродаж</li></ul>',
      sortOrder: 0,
    },
    {
      company: 'Mindbox',
      position: 'Customer Success Manager',
      periodFrom: 'Апрель 2022',
      periodTo: 'Февраль 2025',
      description: '<ul><li>Вёл до 13 клиентов с суммарной подпиской более 70 млн ₽ в год</li><li>UPsale дополнительных модулей</li><li>Технический и бизнесовый запуск Программы лояльности в розничной сети на 800+ офлайн магазинов</li><li>Разработка CRM стратегии</li><li>Антикризис менеджмент</li></ul>',
      sortOrder: 1,
    },
    {
      company: 'Mindbox',
      position: 'Младший менеджер проектов',
      periodFrom: 'Июнь 2021',
      periodTo: 'Апрель 2022',
      description: '<ul><li>Работа в чате — помощь клиентам в решении задач</li><li>Обучение работе с платформой</li><li>Настройка и запуск цепочек коммуникаций</li></ul>',
      sortOrder: 2,
    },
    {
      company: 'VAPETIGER',
      position: 'Специалист по маркетингу / Руководитель отдела продаж',
      periodFrom: 'Август 2016',
      periodTo: 'Май 2021',
      description: '<ul><li>Управление интернет-магазином и онлайн-прайсом</li><li>SMM (VK, Instagram, Telegram)</li><li>Полный контроль и ведение на маркетплейсах (Ozon, WB, Яндекс)</li><li>Переговоры с иностранными партнёрами (Китай, США)</li><li>Email-маркетинг, создание и ведение отдела торговых представителей</li></ul>',
      sortOrder: 3,
    },
  ]
  // Clear existing and re-insert
  await prisma.resumeExperience.deleteMany()
  for (const exp of experiences) {
    await prisma.resumeExperience.create({ data: exp })
  }

  // Skills
  await prisma.contentSection.upsert({
    where: { key: 'skills' },
    update: {},
    create: {
      key: 'skills',
      content: '<p>CRM-маркетинг, B2B/B2C продажи, Программы лояльности, Email-маркетинг, Маркетинговая аналитика, Медиапланирование, Ведение переговоров, Python, HTML, Google Analytics</p>',
    },
  })

  // === Contact Buttons ===
  await prisma.contactButton.deleteMany()
  await prisma.contactButton.create({
    data: { label: 'Забронировать демо', url: 'https://calendly.com/selickiy', icon: 'calendar', sortOrder: 0 },
  })

  // === Social Links ===
  const socials = [
    { platform: 'telegram', url: 'https://t.me/iselickiy', enabled: true, sortOrder: 0 },
    { platform: 'email', url: 'i.selickiy@yandex.ru', enabled: true, sortOrder: 1 },
    { platform: 'instagram', url: 'https://www.instagram.com/iselickiy', enabled: true, sortOrder: 2 },
    { platform: 'github', url: '', enabled: false, sortOrder: 3 },
    { platform: 'vk', url: '', enabled: false, sortOrder: 4 },
    { platform: 'linkedin', url: '', enabled: false, sortOrder: 5 },
    { platform: 'youtube', url: '', enabled: false, sortOrder: 6 },
    { platform: 'whatsapp', url: '', enabled: false, sortOrder: 7 },
    { platform: 'habr', url: '', enabled: false, sortOrder: 8 },
  ]
  for (const s of socials) {
    await prisma.socialLink.upsert({
      where: { platform: s.platform },
      update: {},
      create: s,
    })
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
