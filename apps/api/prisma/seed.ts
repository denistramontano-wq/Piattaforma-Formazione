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
            orderIndex: 1,
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
            orderIndex: 2,
            type: 'TRUE_FALSE',
            prompt: 'Il datore di lavoro può delegare tutte le responsabilità in materia di sicurezza.',
            payload: { correct: false },
            explanation: 'Alcuni obblighi (es. valutazione dei rischi) sono indelegabili.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            orderIndex: 3,
            type: 'FILL_BLANK',
            prompt: 'Completa: i DPI sono i ___ di Protezione Individuale.',
            payload: { text: 'i DPI sono i {{1}} di Protezione Individuale.', blanks: { '1': 'Dispositivi' } },
            explanation: 'DPI = Dispositivi di Protezione Individuale.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            orderIndex: 4,
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

  // Quiz avanzato: banca domande, tentativi limitati, tempo limite, ordine casuale, drag&drop (docs/04)
  await prisma.quiz.upsert({
    where: { id: 'seed-quiz-avanzato' },
    update: {},
    create: {
      id: 'seed-quiz-avanzato',
      title: 'Verifica avanzata — Gestione delle emergenze',
      description: 'Quiz a estrazione casuale con tempo limite e numero massimo di tentativi.',
      passThresholdPct: 70,
      level: 'AVANZATO',
      maxAttempts: 2,
      timeLimitSeconds: 180,
      questionMode: 'RANDOM',
      bankSize: 4,
      questions: {
        create: [
          {
            orderIndex: 1,
            type: 'DRAG_DROP',
            prompt: 'Colloca ogni dispositivo antincendio nell’area corretta.',
            payload: {
              items: [
                { id: 'i1', label: 'Estintore a CO2' },
                { id: 'i2', label: 'Idrante' },
                { id: 'i3', label: 'Rilevatore di fumo' },
              ],
              targets: [
                { id: 't1', label: 'Quadro elettrico' },
                { id: 't2', label: 'Corridoio principale' },
                { id: 't3', label: 'Controsoffitto ufficio' },
              ],
              correctMap: { i1: 't1', i2: 't2', i3: 't3' },
            },
            explanation: 'Gli estintori a CO2 sono adatti per incendi elettrici; gli idranti coprono le vie di fuga.',
            scoreWeight: 2,
            difficulty: 'AVANZATO',
          },
          {
            orderIndex: 2,
            type: 'MULTIPLE_CHOICE',
            prompt: 'Chi coordina l’evacuazione in caso di emergenza?',
            payload: {
              options: [
                { id: 'a', text: 'Il primo che se ne accorge' },
                { id: 'b', text: 'Gli addetti antincendio designati' },
                { id: 'c', text: 'Nessuno, ognuno per sé' },
              ],
              correct: ['b'],
            },
            explanation: 'Gli addetti designati (D.Lgs. 81/2008) coordinano l’evacuazione.',
            scoreWeight: 1,
            difficulty: 'INTERMEDIO',
          },
          {
            orderIndex: 3,
            type: 'TRUE_FALSE',
            prompt: 'In caso di incendio è sempre corretto usare l’ascensore per scendere più velocemente.',
            payload: { correct: false },
            explanation: 'Gli ascensori vanno sempre evitati in caso di incendio.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            orderIndex: 4,
            type: 'IMAGE_CHOICE',
            prompt: 'Quale simbolo indica il punto di raccolta?',
            payload: {
              options: [
                { id: 'a', imageUrl: '🟩 Verde con persone che corrono verso un punto' },
                { id: 'b', imageUrl: '⛔ Cerchio rosso' },
                { id: 'c', imageUrl: '⚠️ Triangolo giallo' },
              ],
              correct: ['a'],
            },
            explanation: 'I segnali di salvataggio/emergenza sono verdi e quadrati/rettangolari.',
            scoreWeight: 1,
            difficulty: 'BASE',
          },
          {
            orderIndex: 5,
            type: 'OPEN_TEXT',
            prompt: 'Descrivi brevemente cosa fare al suono dell’allarme antincendio.',
            payload: { keywords: ['calma', 'evacu', 'uscita', 'punto di raccolta'] },
            explanation: 'Risposta valutata per parole chiave: mantenere la calma, evacuare verso l’uscita più vicina, raggiungere il punto di raccolta.',
            scoreWeight: 1,
            difficulty: 'INTERMEDIO',
          },
        ],
      },
    },
  });

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

  // Regole XP (docs/05 §5.2 — configurabili da /admin/xp-rules)
  const xpRules: { action: string; points: number; description: string }[] = [
    { action: 'LESSON_COMPLETED', points: 10, description: 'Completamento di una lezione' },
    { action: 'COURSE_COMPLETED', points: 50, description: 'Completamento di un intero corso' },
    { action: 'QUIZ_PASSED', points: 20, description: 'Superamento di un quiz' },
    { action: 'GAME_COMPLETED', points: 15, description: 'Completamento di un mini gioco' },
    { action: 'DAILY_STREAK', points: 5, description: 'Accesso giornaliero alla piattaforma' },
  ];
  for (const rule of xpRules) {
    await prisma.xpRule.upsert({
      where: { action: rule.action },
      update: {},
      create: rule,
    });
  }

  // Badge demo (docs/05 §5.2 — il `code` collega il badge al motore di regole, vedi badge-engine.service.ts)
  const badge = await prisma.badge.upsert({
    where: { id: 'seed-badge-primo-corso' },
    update: {},
    create: {
      id: 'seed-badge-primo-corso',
      code: 'PRIMO_CORSO',
      name: 'Primo corso completato',
      criteriaDescription: 'Assegnato al completamento del primo corso sulla piattaforma.',
    },
  });
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: student.id, badgeId: badge.id } },
    update: {},
    create: { userId: student.id, badgeId: badge.id },
  });
  await prisma.badge.upsert({
    where: { id: 'seed-badge-streak-7' },
    update: {},
    create: {
      id: 'seed-badge-streak-7',
      code: 'STREAK_7',
      name: '7 giorni di fila',
      criteriaDescription: 'Assegnato per 7 giorni consecutivi di accesso alla piattaforma.',
    },
  });
  await prisma.badge.upsert({
    where: { id: 'seed-badge-quiz-perfetto' },
    update: {},
    create: {
      id: 'seed-badge-quiz-perfetto',
      code: 'QUIZ_PERFETTO',
      name: 'Quiz perfetto',
      criteriaDescription: 'Assegnato per il 100% di risposte corrette in un quiz di livello avanzato.',
    },
  });
  await prisma.badge.upsert({
    where: { id: 'seed-badge-esploratore-giochi' },
    update: {},
    create: {
      id: 'seed-badge-esploratore-giochi',
      code: 'ESPLORATORE_GIOCHI',
      name: 'Esploratore dei mini giochi',
      criteriaDescription: 'Assegnato per aver giocato ad almeno 3 tipi diversi di mini gioco.',
    },
  });

  // Mini giochi — tipologie aggiuntive (docs/05 §5.1)
  await prisma.miniGame.upsert({
    where: { id: 'seed-game-dragdrop' },
    update: {},
    create: {
      id: 'seed-game-dragdrop',
      title: 'Drag & Drop — Colloca i DPI',
      type: 'DRAG_DROP',
      description: 'Trascina ogni dispositivo di protezione nell’area del reparto corretto.',
      difficulty: 'BASE',
      config: {
        items: [
          { id: 'i1', label: 'Casco' },
          { id: 'i2', label: 'Guanti anti-taglio' },
          { id: 'i3', label: 'Otoprotettori' },
          { id: 'i4', label: 'Occhiali di protezione' },
        ],
        zones: [
          { id: 'z1', label: 'Cantiere edile' },
          { id: 'z2', label: 'Officina meccanica' },
          { id: 'z3', label: 'Reparto rumoroso' },
          { id: 'z4', label: 'Laboratorio chimico' },
        ],
        correctMap: { i1: 'z1', i2: 'z2', i3: 'z3', i4: 'z4' },
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-puzzle' },
    update: {},
    create: {
      id: 'seed-game-puzzle',
      title: 'Puzzle — Ricomponi la procedura',
      type: 'PUZZLE',
      description: 'Rimetti in ordine le parole per ricostruire la regola di sicurezza.',
      difficulty: 'BASE',
      config: {
        sentence: 'In caso di incendio mantieni la calma e raggiungi l’uscita di emergenza più vicina',
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-timedquiz' },
    update: {},
    create: {
      id: 'seed-game-timedquiz',
      title: 'Quiz a tempo — Emergenze in azienda',
      type: 'TIMED_QUIZ',
      description: 'Rispondi il più velocemente possibile: più sei rapido, più punti bonus ottieni.',
      difficulty: 'INTERMEDIO',
      config: {
        timeLimitSeconds: 60,
        questions: [
          {
            id: 'q1',
            prompt: 'Qual è il numero unico per le emergenze in Italia?',
            options: ['112', '115', '118', '113'],
            correctIndex: 0,
          },
          {
            id: 'q2',
            prompt: 'Un estintore a CO2 è adatto per un incendio di classe...',
            options: ['A (solidi)', 'B (liquidi infiammabili)', 'D (metalli)', 'Nessuna'],
            correctIndex: 1,
          },
          {
            id: 'q3',
            prompt: 'Il triangolo di sicurezza va posizionato a una distanza minima di:',
            options: ['5 metri', '10 metri', '50 metri', 'Non è obbligatorio'],
            correctIndex: 2,
          },
        ],
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-escaperoom' },
    update: {},
    create: {
      id: 'seed-game-escaperoom',
      title: 'Escape Room — Evacuazione dallo stabilimento',
      type: 'ESCAPE_ROOM',
      description: 'Risolvi in sequenza gli enigmi di sicurezza per uscire in tempo dallo stabilimento.',
      difficulty: 'AVANZATO',
      config: {
        intro: 'È scattato l’allarme antincendio. Risolvi ogni prova per avanzare verso l’uscita.',
        steps: [
          {
            id: 's1',
            narrative: 'Senti l’allarme suonare nel reparto produzione.',
            prompt: 'Qual è la prima cosa da fare?',
            options: ['Continuare a lavorare', 'Mantenere la calma e prepararsi a evacuare', 'Correre verso gli ascensori'],
            correctIndex: 1,
            unlockNarrative: 'Bene, ti allontani dalla postazione senza panico.',
          },
          {
            id: 's2',
            narrative: 'Sei nel corridoio principale, pieno di fumo leggero.',
            prompt: 'Come ti muovi nel corridoio con fumo?',
            options: ['In piedi il più velocemente possibile', 'Chinato, restando vicino al muro', 'Usando l’ascensore più vicino'],
            correctIndex: 1,
            unlockNarrative: 'Ti muovi chinato e raggiungi l’uscita di emergenza.',
          },
          {
            id: 's3',
            narrative: 'Sei arrivato al punto di raccolta.',
            prompt: 'Cosa fai una volta al punto di raccolta?',
            options: ['Te ne vai a casa', 'Attendi l’appello del preposto', 'Rientri per prendere gli effetti personali'],
            correctIndex: 1,
            unlockNarrative: 'Sei in salvo: l’appello conferma che tutti sono usciti.',
          },
        ],
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-finderror' },
    update: {},
    create: {
      id: 'seed-game-finderror',
      title: 'Trova l’errore — Postazione al videoterminale',
      type: 'FIND_ERROR',
      description: 'Individua nel testo i comportamenti scorretti per la sicurezza sul lavoro.',
      difficulty: 'INTERMEDIO',
      config: {
        tokens: [
          'Prima', 'di', 'iniziare', 'il', 'turno,', 'Marco', 'ignora', 'le', 'istruzioni', 'di', 'sicurezza',
          'e', 'toglie', 'i', 'guanti', 'di', 'protezione', 'per', 'lavorare', 'più', 'comodo.', 'Regola', 'lo',
          'schienale', 'della', 'sedia', 'e', 'posiziona', 'lo', 'schermo', 'a', 'circa', 'un', 'braccio', 'di',
          'distanza.',
        ],
        errorIndexes: [6, 13],
        explanations: {
          '6': 'Le istruzioni di sicurezza non vanno mai ignorate.',
          '13': 'I DPI previsti non devono essere rimossi senza autorizzazione.',
        },
      },
    },
  });

  await prisma.miniGame.upsert({
    where: { id: 'seed-game-imagematch' },
    update: {},
    create: {
      id: 'seed-game-imagematch',
      title: 'Abbinamento immagini — Segnali di sicurezza',
      type: 'IMAGE_MATCH',
      description: 'Abbina ogni forma/colore di segnale al suo significato corretto.',
      difficulty: 'BASE',
      config: {
        pairs: [
          { emoji: '⛔', label: 'Divieto' },
          { emoji: '⚠️', label: 'Attenzione/Pericolo' },
          { emoji: '🟩', label: 'Salvataggio/Emergenza' },
          { emoji: '🔵', label: 'Obbligo (es. indossare i DPI)' },
        ],
      },
    },
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
