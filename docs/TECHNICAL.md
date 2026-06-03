# Documentação Técnica — AprenderJá

## Endpoints da API

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | Não | Cria conta |
| POST | `/api/auth/login` | Não | Login |
| POST | `/api/auth/logout` | Opcional | Encerra sessão |
| POST | `/api/auth/refresh` | Cookie refresh | Renova tokens |
| GET | `/api/auth/me` | Sim | Dados do usuário logado |

### Cursos e progresso

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/courses` | Sim | Lista cursos com módulos |
| GET | `/api/progress/:userId` | Sim | Resumo de progresso |
| POST | `/api/progress/lesson` | Sim | Avança uma lição |
| GET | `/api/profile` | Sim | Preferências do usuário |
| PATCH | `/api/profile` | Sim | Atualiza ritmo/pausa |

## Payloads

### POST /api/auth/register

```json
{
  "name": "Ana Silva",
  "email": "ana@email.com",
  "password": "senha123"
}
```

**Resposta 200:**

```json
{
  "user": { "id": "...", "name": "...", "email": "...", "createdAt": "..." },
  "accessToken": "..."
}
```

+ Cookies: `access_token`, `refresh_token`

### POST /api/progress/lesson

```json
{ "moduleId": "clxxx..." }
```

**Resposta 200:**

```json
{
  "message": "Lição 3 de 10 concluída.",
  "moduleCompleted": false,
  "moduleTitle": "Planilhas do Zero ao Avançado",
  "lessonNumber": 3,
  "totalLessons": 10,
  "percentComplete": 30
}
```

## Segurança

| Medida | Implementação |
|--------|---------------|
| Hash de senha | Argon2id (memoryCost 65536) |
| JWT | HMAC-SHA256, expiração configurável |
| Refresh token | Armazenado no DB, revogável |
| Cookies | HttpOnly, SameSite=Lax, Secure em prod |
| Validação | Zod em auth e progress |
| Isolamento | `userId` do JWT comparado ao recurso |
| SQL Injection | Prisma parameterized queries |

## Estrutura frontend

```
src/frontend/
├── context/AuthContext.tsx   # Provider global
└── hooks/useDashboard.ts     # Cursos + progresso + API
```

## Estrutura backend

```
src/backend/
├── config/env.ts
├── lib/prisma.ts
├── middlewares/auth.middleware.ts
├── repositories/
│   ├── user.repository.ts
│   ├── session.repository.ts
│   └── progress.repository.ts
├── services/auth/password.service.ts
├── usecases/auth/auth.usecase.ts
└── utils/
    ├── jwt.ts
    ├── cookies.ts
    └── response.ts
```

## Banco de dados

Ver [`database/README.md`](../database/README.md).

## Variáveis de ambiente

Ver [`.env.example`](../.env.example).

## Scripts de desenvolvimento

```bash
bun install
bun run db:push && bun run db:seed
bun run dev
```

## Testes manuais recomendados

1. Registrar nova conta → redireciona ao dashboard
2. Avançar lição → progresso persiste após reload
3. Logout → redireciona ao login, APIs retornam 401
4. Login com outro usuário → progresso zerado (isolamento)
5. Alterar ritmo → reflete nas estimativas
6. Testar em viewport 375px (mobile) e 768px (tablet)
