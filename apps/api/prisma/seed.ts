import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.piattaforma-formazione.it' },
    update: {},
    create: {
      email: 'admin@demo.piattaforma-formazione.it',
      fullName: 'Giulia Bianchi',
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'maria.rossi@demo.piattaforma-formazione.it' },
    update: {},
    create: {
      email: 'maria.rossi@demo.piattaforma-formazione.it',
      fullName: 'Maria Rossi',
      role: 'STUDENT',
    },
  });

  await prisma.userLevel.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, currentLevel: 3, totalXp: 420 },
  });

  // Categorie
  const sicurezza = await prisma.category.upsert({
    where: { slug: 'sicurezza-sul-lavoro' },
    update: {},
    create: { name: 'Sicurezza sul lavoro', slug: 'sicurezza-sul-lavoro' },
  });
  const softSkill = await prisma.category.upsert({
    where: { slug: 'soft-skill' },
    update: {},
    create: { name: 'Soft skill', slug: 'soft-skill' },
  });
  const it = await prisma.category.upsert({
    where: { slug: 'competenze-digitali' },
    update: {},
    create: { name: 'Competenze digitali', slug: 'competenze-digitali' },
  });
  await prisma.category.upsert({
    where: { slug: 'sicurezza-antincendio' },
    update: {},
    create: { name: 'Antincendio', slug: 'sicurezza-antincendio', parentId: sicurezza.id },
  });

  const tagObbligatorio = await prisma.tag.upsert({
    where: { name: 'obbligatorio' },
    update: {},
    create: { name: 'obbligatorio' },
  });
  const tagOnboarding = await prisma.tag.upsert({
    where: { name: 'onboarding' },
    update: {},
    create: { name: 'onboarding' },
  });

  // Corso 1: Sicurezza sul lavoro
  const corso1 = await prisma.course.upsert({
    where: { slug: 'sicurezza-sul-lavoro-base' },
    update: {},
    create: {
      title: 'Sicurezza sul lavoro — Corso base',
      slug: 'sicurezza-sul-lavoro-base',
      description:
        'Corso obbligatorio sui principi fondamentali della sicurezza nei luoghi di lavoro, rischi generali e procedure di emergenza.',
      coverUrl: 'https://picsum.photos/seed/sicurezza/640/360',
      authorId: admin.id,
      level: 'BASE',
      estimatedMinutes: 90,
      status: 'PUBLISHED',
      categories: { connect: [{ id: sicurezza.id }] },
      tags: { connect: [{ id: tagObbligatorio.id }] },
      modules: {
        create: [
          {
            title: 'Introduzione ai rischi',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Cos’è la sicurezza sul lavoro',
                  orderIndex: 1,
                  estimatedMinutes: 15,
                  contentType: 'TEXT',
                  contentBody:
                    'La sicurezza sul lavoro è l’insieme delle misure organizzative, tecniche e procedurali volte a prevenire infortuni e malattie professionali. In questa lezione vedremo i principi normativi di base (D.Lgs. 81/2008) e i ruoli coinvolti: datore di lavoro, RSPP, RLS, medico competente.',
                },
                {
                  title: 'Dispositivi di protezione individuale (DPI)',
                  orderIndex: 2,
                  estimatedMinutes: 20,
                  contentType: 'VIDEO',
                  videoUrl: 'https://example-cdn.piattaforma-formazione.it/videos/dpi-intro.m3u8',
                },
              ],
            },
          },
          {
            title: 'Procedure di emergenza',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Piano di evacuazione',
                  orderIndex: 1,
                  estimatedMinutes: 25,
                  contentType: 'PDF',
                  contentBody: 'Consulta il manuale allegato per il piano di evacuazione della sede.',
                },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Corso 2: Soft skill
  const corso2 = await prisma.course.upsert({
    where: { slug: 'comunicazione-efficace' },
    update: {},
    create: {
      title: 'Comunicazione efficace in azienda',
      slug: 'comunicazione-efficace',
      description:
        'Tecniche di comunicazione assertiva, ascolto attivo e gestione dei conflitti nei contesti di lavoro quotidiani.',
      coverUrl: 'https://picsum.photos/seed/softskill/640/360',
      authorId: admin.id,
      level: 'INTERMEDIO',
      estimatedMinutes: 60,
      status: 'PUBLISHED',
      categories: { connect: [{ id: softSkill.id }] },
      tags: { connect: [{ id: tagOnboarding.id }] },
      modules: {
        create: [
          {
            title: 'Fondamenti della comunicazione',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Ascolto attivo',
                  orderIndex: 1,
                  estimatedMinutes: 15,
                  contentType: 'TEXT',
                  contentBody:
                    'L’ascolto attivo richiede attenzione piena, domande di chiarimento e riformulazione di quanto detto dall’interlocutore per verificare la comprensione reciproca.',
                },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Corso 3: bozza (per mostrare stato non pubblicato)
  await prisma.course.upsert({
    where: { slug: 'excel-avanzato' },
    update: {},
    create: {
      title: 'Excel avanzato per l’analisi dati',
      slug: 'excel-avanzato',
      description: 'Tabelle pivot, funzioni annidate e dashboard dinamiche in Excel.',
      coverUrl: 'https://picsum.photos/seed/excel/640/360',
      authorId: admin.id,
      level: 'AVANZATO',
      estimatedMinutes: 120,
      status: 'DRAFT',
      categories: { connect: [{ id: it.id }] },
    },
  });

  // Iscrizione + progresso demo per lo studente sul corso 1
  const lezione1 = corso1.modules[0].lessons[0];
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: corso1.id } },
    update: {},
    create: { userId: student.id, courseId: corso1.id, progressPct: 33.3, status: 'IN_PROGRESS' },
  });
  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lezione1.id } },
    update: {},
    create: {
      enrollmentId: enrollment.id,
      lessonId: lezione1.id,
      completed: true,
      timeSpentSeconds: 640,
    },
  });

  // Manuali
  const manuale = await prisma.document.upsert({
    where: { id: 'seed-manuale-evacuazione' },
    update: {},
    create: {
      id: 'seed-manuale-evacuazione',
      title: 'Manuale Piano di Evacuazione',
      description: 'Procedure dettagliate di evacuazione per tutte le sedi aziendali.',
      author: 'Ufficio HSE',
      categoryId: sicurezza.id,
      level: 'BASE',
      estimatedMinutes: 20,
      versions: {
        create: [
          {
            versionNumber: 1,
            fileUrl: 'https://example-cdn.piattaforma-formazione.it/docs/evacuazione-v1.pdf',
            changelog: 'Versione iniziale',
            isCurrent: false,
          },
          {
            versionNumber: 2,
            fileUrl: 'https://example-cdn.piattaforma-formazione.it/docs/evacuazione-v2.pdf',
            changelog: 'Aggiornate planimetrie sede Milano',
            isCurrent: true,
          },
        ],
      },
    },
  });

  await prisma.document.upsert({
    where: { id: 'seed-manuale-dpi' },
    update: {},
    create: {
      id: 'seed-manuale-dpi',
      title: 'Guida ai Dispositivi di Protezione Individuale',
      description: 'Elenco e modalità d’uso dei DPI obbligatori per reparto.',
      author: 'Ufficio HSE',
      categoryId: sicurezza.id,
      level: 'BASE',
      estimatedMinutes: 15,
      versions: { create: [{ versionNumber: 1, fileUrl: 'https://example-cdn.piattaforma-formazione.it/docs/dpi-v1.pdf', isCurrent: true }] },
    },
  });

  // Video
  await prisma.video.upsert({
    where: { id: 'seed-video-dpi' },
    update: {},
    create: {
      id: 'seed-video-dpi',
      title: 'Come indossare correttamente i DPI',
      description: 'Video dimostrativo sull’uso corretto di casco, guanti e scarpe antinfortunistiche.',
      categoryId: sicurezza.id,
      url: 'https://example-cdn.piattaforma-formazione.it/videos/dpi-demo.m3u8',
      durationSeconds: 420,
      level: 'BASE',
    },
  });

  // Quiz con diverse tipologie di domanda
  const quiz = await prisma.quiz.upsert({
    where: { id: 'seed-quiz-sicurezza' },
    update: {},
    create: {
      id: 'seed-quiz-sicurezza',
      title: 'Verifica — Sicurezza sul lavoro',
      description: 'Quiz di verifica sui concetti fondamentali del corso base.',
      lessonId: lezione1.id,
      passThresholdPct: 60,
      level: 'BASE',
      questions: {
        create: [
          {
            type: 'MULTIPLE_CHOICE',
            prompt: 'Quale normativa italiana disciplina la sicurezza sul lavoro?',
            payload: {
              options: [
                { id: 'a', text: 'D.Lgs. 81/2008' },
                { id: 'b', text: 'D.Lgs. 231/2001' },
                { id: 'c', text: 'Legge 104/1992' },
              ],
              correct: ['a'],
            },
            explanation: 'Il D.Lgs. 81/2008 (Testo Unico Sicurezza) è la normativa di riferimento.',
            scoreWeight: 2,
            difficulty: 'BASE',
          },
          {
            type: 'TRUE_FALSE',
            prompt: 'Il datore di lavoro può delegare tutte le responsabilità in materia di sicurezza.',
            payload: { correct: false },
            explanation: 'Alcuni obblighi (es. valutazione dei rischi) sono indelegabili.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            type: 'FILL_BLANK',
            prompt: 'Completa: i DPI sono i ___ di Protezione Individuale.',
            payload: { text: 'i DPI sono i {{1}} di Protezione Individuale.', blanks: { '1': 'Dispositivi' } },
            explanation: 'DPI = Dispositivi di Protezione Individuale.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            type: 'ORDERING',
            prompt: 'Ordina correttamente le fasi di un’evacuazione.',
            payload: {
              items: [
                { id: '1', label: 'Sentire l’allarme' },
                { id: '2', label: 'Raggiungere l’uscita di emergenza più vicina' },
                { id: '3', label: 'Radunarsi nel punto di raccolta' },
              ],
              correctOrder: ['1', '2', '3'],
            },
            explanation: 'La sequenza corretta garantisce un’evacuazione ordinata e sicura.',
            scoreWeight: 2,
            difficulty: 'INTERMEDIO',
          },
        ],
      },
    },
  });
  void quiz;

  // Mini giochi
  await prisma.miniGame.upsert({
    where: { id: 'seed-game-flashcard' },
    update: {},
    create: {
      id: 'seed-game-flashcard',
      title: 'Flashcard — Termini della sicurezza',
      type: 'FLASHCARD',
      description: 'Ripassa i termini chiave della sicurezza sul lavoro con le flashcard.',
      difficulty: 'BASE',
      config: {
        cards: [
          { front: 'DPI', back: 'Dispositivo di Protezione Individuale' },
          { front: 'RSPP', back: 'Responsabile Servizio Prevenzione e Protezione' },
          { front: 'RLS', back: 'Rappresentante dei Lavoratori per la Sicurezza' },
        ],
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-memory' },
    update: {},
    create: {
      id: 'seed-game-memory',
      title: 'Memory — Segnaletica di sicurezza',
      type: 'MEMORY',
      description: 'Abbina ogni segnale di sicurezza al suo significato.',
      difficulty: 'BASE',
      config: {
        pairs: [
          { a: 'Segnale rosso circolare', b: 'Divieto' },
          { a: 'Segnale giallo triangolare', b: 'Attenzione' },
          { a: 'Segnale verde quadrato', b: 'Emergenza/Salvataggio' },
        ],
      },
    },
  });

  // Download
  await prisma.downloadFile.upsert({
    where: { id: 'seed-download-checklist' },
    update: {},
    create: {
      id: 'seed-download-checklist',
      title: 'Checklist DPI per reparto (PDF)',
      description: 'Documento scaricabile con la checklist DPI per ogni reparto produttivo.',
      fileType: 'PDF',
      url: 'https://example-cdn.piattaforma-formazione.it/downloads/checklist-dpi.pdf',
      sizeBytes: 245_000,
      categoryId: sicurezza.id,
    },
  });
  await prisma.downloadFile.upsert({
    where: { id: 'seed-download-template' },
    update: {},
    create: {
      id: 'seed-download-template',
      title: 'Template registro formazione (Excel)',
      description: 'Foglio Excel per tracciare la formazione erogata al personale.',
      fileType: 'EXCEL',
      url: 'https://example-cdn.piattaforma-formazione.it/downloads/registro-formazione.xlsx',
      sizeBytes: 88_000,
      categoryId: it.id,
    },
  });

  // FAQ
  await prisma.faq.upsert({
    where: { id: 'seed-faq-1' },
    update: {},
    create: {
      id: 'seed-faq-1',
      question: 'Come ottengo il certificato di completamento?',
      answer: 'Il certificato viene generato automaticamente al termine di tutte le lezioni e al superamento del quiz finale del corso, ed è disponibile nella sezione Certificati.',
      categoryId: sicurezza.id,
    },
  });
  await prisma.faq.upsert({
    where: { id: 'seed-faq-2' },
    update: {},
    create: {
      id: 'seed-faq-2',
      question: 'Posso rifare un quiz se non lo supero?',
      answer: 'Sì, salvo diversa impostazione dell’amministratore, puoi ripetere il quiz fino al numero massimo di tentativi previsto.',
    },
  });

  // Certificato demo (corso soft skill considerato completato)
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: corso2.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: corso2.id,
      status: 'COMPLETED',
      progressPct: 100,
      completedAt: new Date(),
    },
  });
  await prisma.certificate.upsert({
    where: { verifyCode: 'CERT-DEMO-0001' },
    update: {},
    create: {
      userId: student.id,
      courseId: corso2.id,
      verifyCode: 'CERT-DEMO-0001',
      pdfUrl: 'https://example-cdn.piattaforma-formazione.it/certificates/demo-0001.pdf',
    },
  });

  // Badge demo
  const badge = await prisma.badge.upsert({
    where: { id: 'seed-badge-primo-corso' },
    update: {},
    create: {
      id: 'seed-badge-primo-corso',
      name: 'Primo corso completato',
      criteriaDescription: 'Assegnato al completamento del primo corso sulla piattaforma.',
    },
  });
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: student.id, badgeId: badge.id } },
    update: {},
    create: { userId: student.id, badgeId: badge.id },
  });

  console.log('Seed completato.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
