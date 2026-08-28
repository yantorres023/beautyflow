# Repository Guidelines

## Project Overview

BeautyFlow is a tenant-aware Next.js application for a beauty professional to manage clients, services, appointments, payments, expenses, and financial indicators. The initial UI is in Brazilian Portuguese, uses BRL, and defaults to `America/Sao_Paulo`; keep domain code ready for future SaaS workspaces and team members.

## Project Structure

- `src/app/`: App Router pages, route groups, layouts, and the Auth.js route handler.
- `src/modules/`: feature modules (`auth`, `clients`, `services`, `appointments`, `payments`, `expenses`, `dashboard`, `demo`, and `public-booking`). Keep queries, commands, schemas, types, and feature components together.
- `src/server/`: Prisma, authentication context, authorization, and mail delivery integrations.
- `src/lib/` and `src/components/`: shared utilities, layout pieces, and reusable UI primitives.
- `prisma/`: `schema.prisma`, committed migrations, and development seed data.
- `tests/unit`, `tests/integration`, and `tests/e2e`: Vitest, PostgreSQL-backed integration tests, and Playwright flows.

## Build, Test, and Development Commands

Run `npm run dev` for local development, `npm run build` for a production build, `npm run start` to serve that build, and `npm run lint` for ESLint. Use `npm test` or `npm run test:watch` for Vitest and `npm run test:e2e` for Playwright. Use `npm run db:up`/`db:down` for Docker Compose, `npm run db:migrate` for Prisma development migrations, `npm run db:generate` to regenerate the client, and `npm run db:seed` for fixtures. Keep `package-lock.json` committed.

## Coding and Domain Conventions

Use TypeScript, two-space indentation, semantic Tailwind tokens, and accessible SVG icons; do not use emoji as structural icons. Use `camelCase` for values/functions, `PascalCase` for components/types, and `kebab-case` for route and feature directories. Use Server Components by default and Server Actions with Zod validation for mutations. Never query Prisma directly from UI components.

Every tenant-owned query and mutation must resolve the authenticated organization on the server and filter by `organizationId`; never trust a tenant ID from the browser. Store money as integer centavos, dates as UTC timestamps or SQL dates where appropriate, and snapshot service price/duration into appointments. Enforce appointment overlap in PostgreSQL as well as in application validation. Archive historical records instead of deleting them.

The public `/demo` route is intentionally separate from Auth.js and Prisma: it must use fictional browser-local state only, never accept secrets, and never read or write tenant data.

The public `/agendar/[slug]` route resolves the organization by its public slug, accepts only service/date/time/contact data, and creates a `SCHEDULED` appointment for the first active member until per-member availability is introduced. It stores only a hash of the private status token and returns `/agendar/[slug]/status/[token]`; never expose the raw token or tenant identifiers in database queries.

The public booking UI suggests 30-minute slots between 09:00 and 19:00 for the next 14 days and filters known busy intervals. This is a presentation default until working hours are configurable; server-side validation and the PostgreSQL exclusion constraint remain authoritative. The private status URL is the source of truth for clients; a transition to `CONFIRMED` may attempt a confirmation email when the client supplied an address, but Resend delivery is best-effort and must never block the status change.

The authenticated agenda accepts a validated `?semana=YYYY-MM-DD` query to browse any week, while preserving the organization timezone when calculating week boundaries.

## Testing and Contributions

Add regression coverage for business rules, especially tenant isolation, appointment conflicts, payment balances, and cash-versus-accrual calculations. Pull requests must describe the behavior changed, list validation commands, link an issue when relevant, and include screenshots for UI changes. Use short imperative Conventional Commit-style messages such as `feat: add appointment calendar` or `fix: prevent overlapping appointments`.

## Security and Configuration

Keep secrets in ignored `.env.local`; document names only in `.env.example`. Required values include `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, and `EMAIL_FROM`. Passwords must be hashed with a modern password hash, password-reset tokens must be hashed and single-use, public booking tokens must be hashed and non-guessable, and authentication errors must not reveal whether an account exists. Email confirmation is temporarily disabled in the MVP, so new accounts are activated at registration.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
