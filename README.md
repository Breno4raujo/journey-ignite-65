# AprenderJá

> Plataforma de requalificação profissional para adultos — aprenda no seu ritmo, com progresso real e dados isolados por conta.

## Visão geral

O AprenderJá é uma edtech focada em adultos em transição de carreira. O aluno acompanha módulos, celebra conquistas e personaliza seu ritmo de estudo (leve, focado ou intenso), com persistência individual no banco de dados.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/ui |
| Backend | TanStack Start (API Routes), arquitetura em camadas |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh), cookies HttpOnly, Argon2id |
| Validação | Zod |
| Runtime | Bun / Node.js |
| Deploy | Cloudflare (via Vite plugin) |

## Arquitetura

Separação lógica **frontend / backend** dentro de `src/`:

```
src/
├── frontend/          # UI, context, hooks
├── backend/           # services, repositories, usecases, middlewares
├── shared/            # schemas e tipos compartilhados
├── routes/            # páginas + controllers API (TanStack Start)
└── components/        # componentes visuais (identidade AprenderJá)
```

Documentação detalhada em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e [`docs/TECHNICAL.md`](docs/TECHNICAL.md).

## Instalação

```bash
git clone <repo>
cd AprenderJa
cp .env.example .env
# Edite DATABASE_URL e JWT_SECRET

bun install
bun run db:push
bun run db:seed
bun run dev
```

Acesse: `http://localhost:5173`

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL |
| `JWT_SECRET` | Sim | Segredo para access tokens |
| `JWT_REFRESH_SECRET` | Não | Segredo para refresh (default: JWT_SECRET) |
| `ACCESS_TOKEN_TTL_SECONDS` | Não | Default: 3600 (1h) |
| `REFRESH_TOKEN_TTL_SECONDS` | Não | Default: 604800 (7d) |
| `NODE_ENV` | Não | development / production |

## Scripts

| Script | Descrição |
|--------|-----------|
| `bun run dev` | Servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run preview` | Preview do build |
| `bun run db:generate` | Gera Prisma Client |
| `bun run db:push` | Sincroniza schema com o banco |
| `bun run db:migrate` | Cria/aplica migrações |
| `bun run db:seed` | Popula curso inicial |
| `bun run db:studio` | Prisma Studio |
| `bun run lint` | ESLint |

## Estrutura de pastas

```
AprenderJa/
├── database/          # Seeds e docs do banco
├── docs/              # PRD, arquitetura, docs técnicas
├── prisma/            # Schema Prisma (fonte de verdade)
├── src/
│   ├── backend/       # Lógica de servidor
│   ├── frontend/      # Context, hooks
│   ├── shared/        # Schemas Zod
│   ├── routes/        # Rotas e APIs
│   └── components/    # UI
└── package.json
```

## Fluxo da aplicação

1. Usuário acessa `/login` → registra ou entra
2. Backend valida credenciais, emite JWT + refresh token (cookies HttpOnly)
3. Dashboard (`/`) carrega cursos e progresso via API autenticada
4. Cada ação (avançar lição, alterar ritmo) persiste no banco por `userId`
5. Logout revoga refresh tokens e limpa cookies

## Autenticação

- **Registro/Login:** Argon2id para senhas, JWT HS256 para tokens
- **Sessão:** Cookies `access_token` + `refresh_token` (HttpOnly, SameSite=Lax)
- **Refresh:** `POST /api/auth/refresh` renova par de tokens
- **Proteção:** Middleware `requireAuth` em todas as rotas privadas
- **Frontend:** `AuthProvider` + redirecionamento para `/login`

## Deploy

1. Configure PostgreSQL gerenciado (Neon, Supabase, RDS)
2. Defina variáveis de ambiente no provedor
3. Execute migrações: `bun run db:migrate`
4. Execute seed: `bun run db:seed`
5. Build: `bun run build`

> **Nota Cloudflare:** Argon2 usa bindings nativos — para Workers puros, considere `@node-rs/argon2` ou Web Crypto com PBKDF2. O deploy Node/Bun tradicional funciona sem alterações.

## Roadmap

- [ ] Recuperação de senha por e-mail
- [ ] Rate limiting por IP
- [ ] Painel admin para gestão de cursos
- [ ] Notificações de marcos por e-mail
- [ ] Testes E2E (Playwright)
- [ ] PWA offline para micro-hábitos

## Licença

Projeto privado — AprenderJá.
