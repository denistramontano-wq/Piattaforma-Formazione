# 10. Modello del database

Schema logico su PostgreSQL, suddiviso per dominio per leggibilità. Le chiavi esterne sono omesse dai nomi campo quando ovvie (es. `course_id` referenzia `courses.id`).

## 10.1 Dominio Utenti & Auth

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : ha
    ROLES ||--o{ USER_ROLES : assegnato
    USERS ||--o{ USER_SESSIONS : apre
    USERS ||--o{ USER_PREFERENCES : imposta

    USERS {
        uuid id PK
        string email
        string password_hash
        string full_name
        string avatar_url
        string locale
        enum status "active|invited|suspended"
        timestamp created_at
    }
    ROLES {
        uuid id PK
        string name "admin|editor|user"
        jsonb permissions
    }
    USER_ROLES {
        uuid user_id FK
        uuid role_id FK
        uuid scope_category_id FK "opzionale: ruolo limitato a una categoria"
    }
    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash
        string device_info
        timestamp expires_at
    }
    USER_PREFERENCES {
        uuid user_id PK, FK
        string theme "light|dark|system"
        jsonb notification_settings
    }
```

## 10.2 Dominio Contenuti (CMS)

```mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : parent_of
    COURSES ||--o{ MODULES : contiene
    MODULES ||--o{ LESSONS : contiene
    LESSONS ||--o{ CONTENT_BLOCKS : contiene
    COURSES }o--o{ CATEGORIES : classificato
    COURSES }o--o{ TAGS : etichettato
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : ha
    LESSONS ||--o{ FILES : allega

    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        string name
        string slug
    }
    TAGS {
        uuid id PK
        string name
    }
    COURSES {
        uuid id PK
        string title
        text description
        uuid author_id FK
        enum level "base|intermedio|avanzato"
        int estimated_minutes
        enum status "draft|scheduled|published|archived"
        timestamp publish_at
        timestamp created_at
    }
    MODULES {
        uuid id PK
        uuid course_id FK
        string title
        int order_index
    }
    LESSONS {
        uuid id PK
        uuid module_id FK
        string title
        int order_index
        int estimated_minutes
        enum status
    }
    CONTENT_BLOCKS {
        uuid id PK
        uuid lesson_id FK
        enum type "text|video|pdf|image|quiz|game|download"
        jsonb payload
        int order_index
    }
    DOCUMENTS {
        uuid id PK
        string title
        uuid category_id FK
        uuid current_version_id FK
    }
    DOCUMENT_VERSIONS {
        uuid id PK
        uuid document_id FK
        int version_number
        string file_url
        text extracted_text
        boolean is_current
        timestamp created_at
    }
    FILES {
        uuid id PK
        string owner_type "lesson|course|document"
        uuid owner_id
        string file_type "pdf|word|excel|pptx|image|video"
        string url
        bigint size_bytes
        enum scan_status "pending|clean|infected"
    }
    VIDEOS {
        uuid id PK
        uuid lesson_id FK
        string hls_manifest_url
        int duration_seconds
    }
```

## 10.3 Dominio Progressi & Iscrizioni

```mermaid
erDiagram
    USERS ||--o{ ENROLLMENTS : iscritto
    COURSES ||--o{ ENROLLMENTS : riceve
    ENROLLMENTS ||--o{ LESSON_PROGRESS : traccia
    USERS ||--o{ STUDY_SESSIONS : genera
    USERS ||--o{ CERTIFICATES : ottiene
    COURSES ||--o{ CERTIFICATES : certifica

    ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        enum status "in_progress|completed|abandoned"
        decimal progress_pct
        timestamp enrolled_at
        timestamp completed_at
    }
    LESSON_PROGRESS {
        uuid id PK
        uuid enrollment_id FK
        uuid lesson_id FK
        boolean completed
        int time_spent_seconds
        timestamp last_viewed_at
    }
    STUDY_SESSIONS {
        uuid id PK
        uuid user_id FK
        timestamp started_at
        int duration_seconds
    }
    CERTIFICATES {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string verify_code
        string pdf_url
        timestamp issued_at
    }
```

## 10.4 Dominio Quiz

```mermaid
erDiagram
    QUIZZES ||--o{ QUESTIONS : contiene
    QUIZZES ||--o{ QUIZ_ATTEMPTS : genera
    QUIZ_ATTEMPTS ||--o{ QUIZ_ATTEMPT_ANSWERS : registra
    QUESTIONS ||--o{ QUIZ_ATTEMPT_ANSWERS : risposta_a
    QUESTIONS ||--o{ QUESTION_STATS : aggrega

    QUIZZES {
        uuid id PK
        uuid lesson_id FK "nullable, quiz standalone se null"
        string title
        enum mode "sequential|random|question_bank"
        decimal pass_threshold_pct
        int max_attempts
        int time_limit_seconds
    }
    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        enum type "multiple_choice|true_false|open_text|fill_blank|drag_drop|ordering|image_choice"
        text prompt
        jsonb payload "opzioni/risposte corrette per tipo"
        text explanation
        int score_weight
        enum difficulty
    }
    QUIZ_ATTEMPTS {
        uuid id PK
        uuid quiz_id FK
        uuid user_id FK
        decimal score_pct
        boolean passed
        timestamp started_at
        timestamp submitted_at
    }
    QUIZ_ATTEMPT_ANSWERS {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        jsonb answer_payload
        boolean is_correct
        int score_obtained
    }
    QUESTION_STATS {
        uuid question_id PK, FK
        int times_answered
        int times_wrong
        decimal wrong_rate
    }
```

## 10.5 Dominio Gamification

```mermaid
erDiagram
    USERS ||--o{ XP_EVENTS : accumula
    USERS ||--|| USER_LEVELS : ha
    USERS ||--o{ USER_BADGES : ottiene
    BADGES ||--o{ USER_BADGES : assegnato
    MINI_GAMES ||--o{ GAME_SESSIONS : genera
    USERS ||--o{ GAME_SESSIONS : gioca

    MINI_GAMES {
        uuid id PK
        string title
        enum type "flashcard|memory|drag_drop|puzzle|timed_quiz|escape_room|find_error|image_match"
        jsonb config
        enum difficulty
    }
    GAME_SESSIONS {
        uuid id PK
        uuid game_id FK
        uuid user_id FK
        int score
        int duration_seconds
        timestamp played_at
    }
    XP_RULES {
        uuid id PK
        string action_code
        int points
    }
    XP_EVENTS {
        uuid id PK
        uuid user_id FK
        string action_code
        int points
        timestamp created_at
    }
    USER_LEVELS {
        uuid user_id PK, FK
        int current_level
        int total_xp
    }
    BADGES {
        uuid id PK
        string name
        text criteria_description
        jsonb rule
        string icon_url
    }
    USER_BADGES {
        uuid user_id FK
        uuid badge_id FK
        timestamp earned_at
    }
```

## 10.6 Dominio Intelligenza Artificiale

```mermaid
erDiagram
    DOCUMENT_VERSIONS ||--o{ DOCUMENT_CHUNKS : suddiviso
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_version_id FK
        int page_number
        text chunk_text
        vector embedding "pgvector"
    }
    AI_GENERATIONS {
        uuid id PK
        uuid source_id FK "documento/lezione sorgente"
        string source_type
        enum generation_type "summary|quiz|flashcard|concept_map|case_study|simulation"
        jsonb output
        enum review_status "pending|approved|rejected"
        uuid reviewed_by FK
        timestamp created_at
    }
    CHAT_CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        string scope_type "global|course|document"
        uuid scope_id
        timestamp created_at
    }
    CHAT_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        enum role "user|assistant"
        text content
        jsonb source_references
        timestamp created_at
    }
```

## 10.7 Note di progettazione

- **UUID** come chiave primaria ovunque: facilita sharding futuro e integrazione multi-tenant senza collisioni.
- **Soft delete** (`deleted_at`) sulle entità di contenuto principali, per non perdere lo storico legato a progressi/certificati già emessi.
- **Tabelle di riepilogo/materialized view** (`daily_usage_stats`, `course_funnel_stats`) separate dalle tabelle transazionali per non appesantire le query analitiche della dashboard admin (cap. 7 e 16).
- **Multi-tenancy** (se la piattaforma sarà venduta a più organizzazioni): aggiungere `organization_id` come colonna di partizionamento su tutte le tabelle principali fin dal disegno iniziale, anche se l'MVP gestisce un solo tenant — evita una migrazione dolorosa in seguito.
