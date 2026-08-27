# BeautyFlow

BeautyFlow é uma aplicação web para profissionais de beleza organizarem agenda, clientes e finanças. O MVP usa uma organização por conta desde o início, mantendo o domínio preparado para evoluir para um SaaS multi-tenant com equipe.

## Stack e arquitetura

- Next.js com App Router, React e TypeScript.
- PostgreSQL e Prisma 7, com migrações versionadas em `prisma/migrations`.
- Auth.js com credenciais próprias, confirmação de e-mail e recuperação de senha por Resend.
- Server Components e Server Actions; validação de entrada com Zod.
- Módulos em `src/modules`, regras e integrações no servidor em `src/server`, e páginas em `src/app`.

## Rodando localmente

Pré-requisitos: Node.js 20+, npm e Docker Desktop.

```bash
cp .env.example .env.local
npm install
npm run db:generate
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env.local`. Ajuste `AUTH_SECRET` e, em produção, configure `RESEND_API_KEY` e `EMAIL_FROM`. Em desenvolvimento, os links de confirmação e recuperação são registrados no terminal quando o Resend não está configurado.

Abra `http://localhost:3000`. O usuário seed usa `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`; altere esses valores no `.env.local` antes de executar o seed.

## Comandos úteis

`npm run lint`, `npm run typecheck` e `npm test` executam as verificações estáticas e os testes unitários. `npm run test:e2e` executa os fluxos Playwright. `npm run db:generate` regenera o cliente Prisma; `npm run build` também faz isso automaticamente.

## Regras financeiras e de agenda

Valores são armazenados em centavos inteiros. Faturamento considera atendimentos concluídos; recebimentos consideram pagamentos recebidos; despesas por competência usam `expenseDate`, e resultado de caixa usa despesas pagas. O preço e a duração do serviço são copiados para o agendamento. Sobreposições são validadas na aplicação e por uma constraint de exclusão no PostgreSQL. Registros históricos devem ser arquivados, não apagados.
