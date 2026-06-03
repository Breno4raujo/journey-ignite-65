# AprenderJá 📚
 É uma plataforma voltada para adultos em transição de carreira que estudam tecnologia no tempo livre. O produto resolve um problema concreto: alunos desistem de cursos não pela dificuldade do conteúdo, mas por não conseguirem enxergar o próprio progresso.

A solução é um painel de progresso claro e motivador que mostra ao aluno exatamente onde está, quanto já concluiu e quanto falta — com mensagens de encorajamento que celebram cada etapa.

 # Funcionalidades 
📊 Painel de progresso por módulo com percentual concluído
⏱️ Estimativa de tempo para conclusão baseada no ritmo do aluno
🎉 Mensagens de encorajamento personalizadas ao concluir cada módulo

# Stack 
React + Vite
TanStack Router
PostgreSQL
Prisma
Typescript

## Como rodar localmente
git clone https://github.com/Breno4raujo/AprenderJa
cd aprenderja
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
# Backend

- Autenticação com JWT (register, login, me)
- Hash de senha com Web Crypto API
- Proteção de rotas autenticadas
- Logout com limpeza de token
- API de progresso do aluno (GET e POST)
- Listagem de cursos com módulos
- Schema do banco de dados com Prisma (PostgreSQL)
- Variáveis de ambiente via `.env`

> README completo em construção.
