# 🗄️ Mapa de Codependência - Entidades do Sistema

> Documentação das relações entre todas as entidades do banco de dados Aurius.

---

## 📊 Diagrama de Relacionamentos (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CAMADA PRINCIPAL                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   users     │
                                    │─────────────│
                                    │ id (PK)     │◄─────────────────────────────────┐
                                    │ email       │                                  │
                                    │ name        │                                  │
                                    │ avatar_url  │                                  │
                                    │ role        │                                  │
                                    │ bio         │                                  │
                                    └──────┬──────┘                                  │
                                           │                                         │
              ┌────────────────────────────┼────────────────────────────┐            │
              │                            │                            │            │
              ▼                            ▼                            ▼            │
    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐   │
    │  communities    │          │ community_      │          │  enrollments    │   │
    │─────────────────│          │ members         │          │─────────────────│   │
    │ id (PK)         │◄─────────│─────────────────│          │ id (PK)         │   │
    │ slug            │          │ id (PK)         │          │ user_id (FK)────┼───┤
    │ name            │          │ community_id(FK)│          │ course_id (FK)──┼───┼──┐
    │ owner_id (FK)───┼──────────│ user_id (FK)────┼──────────│ enrolled_at     │   │  │
    │ access_type     │          │ role            │          └─────────────────┘   │  │
    │ settings        │          │ joined_at       │                                │  │
    └────────┬────────┘          └─────────────────┘                                │  │
             │                                                                      │  │
             │    ┌─────────────────────────────────────────────────────────────────┘  │
             │    │                                                                    │
             ▼    ▼                                                                    │
    ┌─────────────────┐                                                               │
    │    courses      │◄──────────────────────────────────────────────────────────────┘
    │─────────────────│
    │ id (PK)         │
    │ community_id(FK)│
    │ title           │
    │ description     │
    │ cover_image_url │
    │ is_locked       │
    │ created_by (FK) │───────► users
    └────────┬────────┘
             │
             │
             ▼
    ┌─────────────────┐
    │    modules      │
    │─────────────────│
    │ id (PK)         │
    │ course_id (FK)──┼──────► courses
    │ title           │
    │ order           │
    └────────┬────────┘
             │
             │
             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │    lessons      │          │ lesson_progress │
    │─────────────────│          │─────────────────│
    │ id (PK)         │◄─────────│ id (PK)         │
    │ module_id (FK)──┼──────────│ lesson_id (FK)  │
    │ title           │          │ user_id (FK)────┼──────► users
    │ video_embed_url │          │ completed_at    │
    │ description     │          └─────────────────┘
    │ order           │
    │ duration        │
    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CAMADA SOCIAL                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │     posts       │
    │─────────────────│
    │ id (PK)         │◄──────────────────────────────────┐
    │ community_id(FK)│──────► communities                │
    │ course_id (FK)  │──────► courses                    │
    │ user_id (FK)    │──────► users                      │
    │ title           │                                   │
    │ content         │                                   │
    │ pinned          │                                   │
    └────────┬────────┘                                   │
             │                                            │
             │                                            │
             ▼                                            │
    ┌─────────────────┐                                   │
    │   comments      │                                   │
    │─────────────────│                                   │
    │ id (PK)         │◄──────────────────────┐          │
    │ post_id (FK)────┼───────────────────────┼──────────┘
    │ user_id (FK)    │──────► users          │
    │ parent_id (FK)──┼───────────────────────┘ (self-reference para replies)
    │ content         │
    └─────────────────┘


    ┌─────────────────┐          ┌─────────────────┐
    │  saved_posts    │          │  announcements  │
    │─────────────────│          │─────────────────│
    │ id (PK)         │          │ id (PK)         │
    │ user_id (FK)────┼──► users │ community_id(FK)│──► communities
    │ post_id (FK)────┼──► posts │ course_id (FK)  │──► courses
    │ saved_at        │          │ user_id (FK)    │──► users
    └─────────────────┘          │ title           │
                                 │ content         │
                                 │ expires_at      │
                                 └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CAMADA COMUNICAÇÃO                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
    │ conversations   │          │ conversation_   │          │   messages      │
    │─────────────────│          │ participants    │          │─────────────────│
    │ id (PK)         │◄─────────│─────────────────│          │ id (PK)         │
    │ type            │          │ id (PK)         │          │ conversation_id │──► conversations
    │ community_id(FK)│──► comm. │ conversation_id │          │ sender_id (FK)  │──► users
    │ created_at      │          │ user_id (FK)────┼──► users │ content         │
    └─────────────────┘          │ joined_at       │          │ sent_at         │
                                 │ last_read_at    │          └─────────────────┘
                                 └─────────────────┘


    ┌─────────────────┐
    │ notifications   │
    │─────────────────│
    │ id (PK)         │
    │ user_id (FK)────┼──────► users
    │ type            │
    │ title           │
    │ message         │
    │ data (JSONB)    │
    │ read            │
    │ created_at      │
    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CAMADA CONVITES                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐          ┌─────────────────┐
    │ community_      │          │ course_invites  │
    │ invites         │          │─────────────────│
    │─────────────────│          │ id (PK)         │
    │ id (PK)         │          │ course_id (FK)──┼──────► courses
    │ community_id(FK)│──► comm. │ email           │
    │ email           │          │ token           │
    │ token           │          │ expires_at      │
    │ expires_at      │          │ created_by (FK) │──────► users
    │ created_by (FK) │──► users │ used_at         │
    │ used_at         │          └─────────────────┘
    └─────────────────┘
```

---

## 🔗 Tabela de Relacionamentos

### Chaves Estrangeiras (FK)

| Tabela Origem | Coluna | Tabela Destino | Tipo | On Delete |
|---------------|--------|----------------|------|-----------|
| `communities` | `owner_id` | `users` | N:1 | CASCADE |
| `community_members` | `community_id` | `communities` | N:1 | CASCADE |
| `community_members` | `user_id` | `users` | N:1 | CASCADE |
| `community_invites` | `community_id` | `communities` | N:1 | CASCADE |
| `community_invites` | `created_by` | `users` | N:1 | CASCADE |
| `courses` | `community_id` | `communities` | N:1 | CASCADE |
| `courses` | `created_by` | `users` | N:1 | SET NULL |
| `modules` | `course_id` | `courses` | N:1 | CASCADE |
| `lessons` | `module_id` | `modules` | N:1 | CASCADE |
| `enrollments` | `user_id` | `users` | N:1 | CASCADE |
| `enrollments` | `course_id` | `courses` | N:1 | CASCADE |
| `lesson_progress` | `user_id` | `users` | N:1 | CASCADE |
| `lesson_progress` | `lesson_id` | `lessons` | N:1 | CASCADE |
| `posts` | `community_id` | `communities` | N:1 | CASCADE |
| `posts` | `course_id` | `courses` | N:1 | CASCADE |
| `posts` | `user_id` | `users` | N:1 | CASCADE |
| `comments` | `post_id` | `posts` | N:1 | CASCADE |
| `comments` | `user_id` | `users` | N:1 | CASCADE |
| `comments` | `parent_id` | `comments` | N:1 | CASCADE |
| `saved_posts` | `user_id` | `users` | N:1 | CASCADE |
| `saved_posts` | `post_id` | `posts` | N:1 | CASCADE |
| `announcements` | `community_id` | `communities` | N:1 | CASCADE |
| `announcements` | `course_id` | `courses` | N:1 | CASCADE |
| `announcements` | `user_id` | `users` | N:1 | CASCADE |
| `notifications` | `user_id` | `users` | N:1 | CASCADE |
| `conversations` | `community_id` | `communities` | N:1 | CASCADE |
| `conversation_participants` | `conversation_id` | `conversations` | N:1 | CASCADE |
| `conversation_participants` | `user_id` | `users` | N:1 | CASCADE |
| `messages` | `conversation_id` | `conversations` | N:1 | CASCADE |
| `messages` | `sender_id` | `users` | N:1 | CASCADE |
| `course_invites` | `course_id` | `courses` | N:1 | CASCADE |
| `course_invites` | `created_by` | `users` | N:1 | CASCADE |

---

## 🌳 Hierarquia de Dependências

```
users (RAIZ - Entidade Central)
│
├── communities (owner_id → users)
│   │
│   ├── community_members (community_id → communities, user_id → users)
│   │
│   ├── community_invites (community_id → communities)
│   │
│   ├── courses (community_id → communities)
│   │   │
│   │   ├── modules (course_id → courses)
│   │   │   │
│   │   │   └── lessons (module_id → modules)
│   │   │       │
│   │   │       └── lesson_progress (lesson_id → lessons, user_id → users)
│   │   │
│   │   ├── enrollments (course_id → courses, user_id → users)
│   │   │
│   │   ├── course_invites (course_id → courses)
│   │   │
│   │   └── announcements (course_id → courses)
│   │
│   ├── posts (community_id → communities, course_id → courses)
│   │   │
│   │   ├── comments (post_id → posts)
│   │   │   │
│   │   │   └── comments (parent_id → comments) [SELF-REFERENCE]
│   │   │
│   │   └── saved_posts (post_id → posts, user_id → users)
│   │
│   ├── announcements (community_id → communities)
│   │
│   └── conversations (community_id → communities)
│       │
│       ├── conversation_participants (conversation_id → conversations)
│       │
│       └── messages (conversation_id → conversations)
│
└── notifications (user_id → users)
```

---

## 🔄 Cascata de Exclusão

### Se deletar um **User**:
```
users
└── CASCADE → communities (onde é owner)
    └── CASCADE → community_members
    └── CASCADE → community_invites
    └── CASCADE → courses
        └── CASCADE → modules
            └── CASCADE → lessons
                └── CASCADE → lesson_progress
        └── CASCADE → enrollments
        └── CASCADE → posts
            └── CASCADE → comments
            └── CASCADE → saved_posts
└── CASCADE → community_members (onde é membro)
└── CASCADE → enrollments
└── CASCADE → lesson_progress
└── CASCADE → posts
└── CASCADE → comments
└── CASCADE → saved_posts
└── CASCADE → notifications
└── CASCADE → conversation_participants
└── CASCADE → messages
```

### Se deletar uma **Community**:
```
communities
└── CASCADE → community_members
└── CASCADE → community_invites
└── CASCADE → courses
    └── CASCADE → modules
        └── CASCADE → lessons
            └── CASCADE → lesson_progress
    └── CASCADE → enrollments
    └── CASCADE → course_invites
    └── CASCADE → posts (via course)
└── CASCADE → posts (direto)
    └── CASCADE → comments
    └── CASCADE → saved_posts
└── CASCADE → announcements
└── CASCADE → conversations
    └── CASCADE → conversation_participants
    └── CASCADE → messages
```

### Se deletar um **Course**:
```
courses
└── CASCADE → modules
    └── CASCADE → lessons
        └── CASCADE → lesson_progress
└── CASCADE → enrollments
└── CASCADE → course_invites
└── CASCADE → posts
    └── CASCADE → comments
    └── CASCADE → saved_posts
└── CASCADE → announcements
```

### Se deletar um **Post**:
```
posts
└── CASCADE → comments
    └── CASCADE → comments (replies)
└── CASCADE → saved_posts
```

---

## 📈 Cardinalidade das Relações

| Relação | Cardinalidade | Descrição |
|---------|---------------|-----------|
| User ↔ Community | N:N | Via `community_members` |
| User ↔ Course | N:N | Via `enrollments` |
| User ↔ Lesson | N:N | Via `lesson_progress` |
| Community → Course | 1:N | Uma comunidade tem vários cursos |
| Course → Module | 1:N | Um curso tem vários módulos |
| Module → Lesson | 1:N | Um módulo tem várias aulas |
| Post → Comment | 1:N | Um post tem vários comentários |
| Comment → Comment | 1:N | Self-reference para replies |
| User → Post | 1:N | Um usuário cria vários posts |
| User → Notification | 1:N | Um usuário recebe várias notificações |
| Conversation → Message | 1:N | Uma conversa tem várias mensagens |

---

## 🔑 Constraints Únicos

| Tabela | Colunas | Propósito |
|--------|---------|-----------|
| `users` | `email` | Email único por usuário |
| `communities` | `slug` | URL amigável única |
| `community_members` | `community_id, user_id` | Um usuário por comunidade |
| `enrollments` | `user_id, course_id` | Uma inscrição por curso/usuário |
| `lesson_progress` | `user_id, lesson_id` | Um progresso por aula/usuário |
| `community_invites` | `token` | Token único para convite |
| `course_invites` | `token` | Token único para convite |

---

## 📋 Resumo das Tabelas

| Camada | Tabelas | Total |
|--------|---------|-------|
| **Usuários** | `users` | 1 |
| **Comunidades** | `communities`, `community_members`, `community_invites` | 3 |
| **Cursos** | `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `course_invites` | 6 |
| **Social** | `posts`, `comments`, `saved_posts`, `announcements` | 4 |
| **Comunicação** | `conversations`, `conversation_participants`, `messages`, `notifications` | 4 |
| **Sistema** | `error_reports` | 1 |
| **Total** | | **19 tabelas** |

---

*Documento gerado em: Dezembro 2024*
*Versão: 1.0*
