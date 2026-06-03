# AprenderJá 📚

> Edtech para Requalificação Profissional de Adultos

## Como rodar

```bash
bun install
bun run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/aprenderja"
JWT_SECRET="seu-segredo-aqui"
```

## Backend

- Autenticação com JWT (register, login, me)
- Hash de senha com Web Crypto API
- Proteção de rotas autenticadas
- Logout com limpeza de token
- API de progresso do aluno (GET e POST)
- Listagem de cursos com módulos
- Schema do banco de dados com Prisma (PostgreSQL)
- Variáveis de ambiente via `.env`

> README completo em construção.