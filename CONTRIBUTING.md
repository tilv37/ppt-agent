# Contributing to CognitiveCanvas

Welcome! This document outlines how to set up, develop, and contribute to the CognitiveCanvas PPT generation platform.

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd ppt-agent
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your LLM API credentials

# 3. Initialize database
npx prisma migrate dev
npm run db:seed

# 4. Start development server
npm run dev
```

Your app is now live at `http://localhost:3000`.

**Test Credentials** (after seed):
- Email: `demo@cognitivecanvas.ai`
- Password: `demo123`

## Development Workflow

### Making Changes

1. **Pick a task** from the [GitHub Project](../../../projects) or issues
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make your change** following patterns in [.github/copilot-instructions.md](.github/copilot-instructions.md)
4. **Test locally**: `npm run dev` (or `npm run build` for production test)
5. **Commit with semantic messages**: `feat: add slide thumbnail preview`
6. **Push and open a PR** against `main`

### Code Style

- Use TypeScript (strict mode)
- Format with Prettier (automatic on save in VS Code)
- Lint with ESLint (run via `npm run lint`)
- Follow patterns in `.github/copilot-instructions.md`

### Testing Before Submit

```bash
npm run build              # Verify production build
npm run lint              # Check code quality (when configured)
```

Both must pass before pushing.

## Project Structure

See `.github/copilot-instructions.md` under "Directory Structure Quick Reference" for a detailed breakdown.

In brief:
- **Frontend pages**: `app/` (Next.js App Router)
- **API routes**: `app/api/v1/`
- **Components**: `components/ui/` (base) + `components/layout/` (product shell)
- **Hooks**: `hooks/` (data fetching via React Query)
- **State**: `store/` (Zustand stores)
- **Database**: `prisma/schema.prisma`
- **Docs**: `docs/` (detailed specs, read-only)

## Key Technologies

- **Next.js 14** (App Router, SSR/SSG)
- **TypeScript** (strict mode)
- **Tailwind CSS** (design tokens in `app/globals.css`)
- **React Query** (server state)
- **Zustand** (client state)
- **Prisma ORM** (SQLite for dev, PostgreSQL for prod)
- **Material Symbols Outlined** (icons)

See [CLAUDE.md](../CLAUDE.md) for full tech stack.

## Common Tasks

### Add a New API Endpoint

1. Create `app/api/v1/{resource}/route.ts`
2. Use `authMiddleware` for protection
3. Import response helpers from `lib/utils/api.ts`
4. Validate input with `lib/utils/validation.ts`
5. Return formatted response

**Example**: [Adding a New API Endpoint in .github/copilot-instructions.md](.github/copilot-instructions.md#creating-a-new-api-endpoint)

### Add a New Page

1. Create `app/{route}/page.tsx`
2. Mark as `"use client"` if interactive
3. Import `ProductTopBar` + `ProductFooter`
4. Use custom hooks for data
5. Use base components from `components/ui/`

**Example**: [Adding a New Page in .github/copilot-instructions.md](.github/copilot-instructions.md#adding-a-new-page)

### Update Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Provide a migration name (e.g., `add_user_avatar`)
4. Commit `.prisma/migrations/` folder

### Reset Development Database

```bash
npm run db:seed  # Drops, recreates, and seeds with demo data
```

## Design & Prototypes

All UI was built to match the approved interactive prototypes in `interactive-prototypes/`:
- `projects.html` → Dashboard (`app/page.tsx`)
- `setup.html` → Setup flow (`app/project/[id]/setup/page.tsx`)
- `generating.html` → Generation view (`app/project/[id]/generating/page.tsx`)
- `editor.html` → Editor workspace (`app/project/[id]/page.tsx`)
- `templates.html` → Template browser (`app/templates/page.tsx`)

When adding UI features, check the prototype first to match layout/interaction patterns.

**Design System**: See `app/globals.css` for color tokens, typography, and utilities.

## Documentation

- **System Overview**: [CLAUDE.md](../CLAUDE.md)
- **Agent Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Detailed Specs**: [docs/](../docs/) folder
  - `ppt-agent-design.md` → Product & architecture
  - `api-design.md` → API endpoints
  - `database-design.md` → Schema & relationships
  - `svg-template-spec.md` → Template system
  - `security-design.md` → Auth & validation
  - `agent-prompt-design.md` → Agent implementations
  - And more...

Refer to docs when implementing features; don't duplicate information.

## Troubleshooting

### "Cannot find module '@/components/ui'"
Ensure `tsconfig.json` has `paths` configured (it should already). Restart your TypeScript server in VS Code.

### "Database is locked"
SQLite WAL mode issue. Run:
```bash
npx prisma db push --force-reset  # Warning: loses all data
npm run db:seed
```

### Build fails with type errors
Run full type check:
```bash
npx tsc --noEmit
```

Check error messages and see `.github/copilot-instructions.md` anti-patterns section.

### "npm test" not working
Testing infrastructure is planned but not yet implemented. See [docs/testing-strategy.md](../docs/testing-strategy.md) for the roadmap.

## Deployment

The project uses Docker + Docker Compose for production. See [docs/deployment.md](../docs/deployment.md) for full setup.

Quick preview:
```bash
docker compose up -d --build  # Builds and starts all services
```

Ensure `.env.production` is configured before deploying.

## Need Help?

1. Check `.github/copilot-instructions.md` for patterns and FAQs
2. Read relevant docs in `docs/`
3. Look at similar existing code (best examples are in `app/api/v1/projects/` and `hooks/useProjects.ts`)
4. Open an issue or ask in the project Slack/Discord

---

**Happy coding!** 🚀
