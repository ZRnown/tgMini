# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router pages and API routes (e.g., `app/page.tsx`, `app/api/*`).
- `server/` holds backend services, auth, and business logic (rebate engine, binding flow, withdrawals).
- `prisma/` stores the schema and migrations.
- `bot/` runs the Telegram admin bot commands.
- `components/`, `hooks/`, `lib/` hold shared UI and utilities.
- `public/` is for static assets (logos, banners, placeholders).
- `docs/` includes architecture and API references.

## Build, Test, and Development Commands
Use `pnpm` with `pnpm-lock.yaml`.
- `pnpm install`: install dependencies.
- `pnpm dev`: start the Next.js dev server.
- `pnpm build`: create a production build.
- `pnpm start`: run the production server after build.
- `pnpm lint`: run ESLint.
- `pnpm bot`: start the Telegram admin bot (`bot/index.ts`).
- `pnpm prisma:generate`: generate Prisma client.
- `pnpm prisma:migrate`: apply dev migrations.
- `pnpm seed`: seed initial data.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled.
- Indentation is 2 spaces; TS/TSX strings usually use double quotes.
- Component files use kebab-case (e.g., `floating-dock.tsx`); React components are PascalCase.
- Hooks follow `useX` naming.
- Prefer Tailwind utility classes; theme tokens live in `tailwind.config.ts`.
- Use the `@/` alias for root imports.

## Testing Guidelines
There is no test runner configured. If you add tests, follow `*.test.tsx` or `__tests__/` naming and document the command here.

## Commit & Pull Request Guidelines
No Git history is included. Use clear Conventional Commits (`feat:`, `fix:`, `chore:`). PRs should include a short summary, linked issues, and UI screenshots/GIFs when relevant.

## Configuration & Security
Use `.env.local` for secrets and do not commit it. Required values: `DATABASE_URL`, `BOT_TOKEN`, `ADMIN_TG_IDS`, and `API_SIGNING_SECRET`. Optional local dev shortcuts include `DEV_TG_ID`/`DEV_TG_USERNAME` for bypassing Telegram initData. If installs warn about ignored build scripts (e.g., Prisma), run `pnpm approve-builds` before generating the client.
