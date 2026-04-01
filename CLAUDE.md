# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CognitiveCanvas** — an AI-powered PPT auto-generation Web system using a multi-Agent + ReAct architecture. Users provide raw content (text/PDF/URL), and the system generates complete slide decks through a pipeline of 9 specialized AI agents.

**Current state**: Design/specification phase. No implementation code exists yet. The repository contains 11 design documents and HTML prototypes.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript (full-stack)
- **Database**: SQLite + Prisma ORM (WAL mode, PostgreSQL migration path planned)
- **Auth**: JWT (HS256, 7-day expiry) + bcrypt (cost=12)
- **LLM**: OpenAI-compatible API via `openai` SDK (model-agnostic: DeepSeek, Qwen, GPT)
- **State**: React Query (server state) + Zustand (UI state)
- **Streaming**: SSE (Server-Sent Events) for real-time agent progress
- **SVG Rendering**: @resvg/resvg-js + sharp (SVG→PNG)
- **PPTX Export**: pptxgenjs
- **Image Search**: Unsplash API (optional, degrades to text-only)
- **PDF Parsing**: pdf-parse (pdfjs-dist)
- **Web Scraping**: cheerio + axios (with SSRF protection)
- **SVG Security**: DOMPurify sanitization, element/attribute whitelists
- **Concurrency**: p-queue (configurable LLM concurrency, default 3)
- **Testing**: Jest + React Testing Library + ts-jest + jest-mock-extended
- **Deployment**: Docker + Docker Compose + Nginx reverse proxy

## Planned Commands

```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm run test             # Server-side unit tests (jest, node env)
npm run test:client      # Frontend component tests (jest, jsdom env)
npm run test:all         # Both server + client tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npx prisma migrate dev   # Run DB migrations (dev)
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # DB GUI
docker compose up -d --build  # Build and start production containers
```

## Architecture

### Multi-Agent Pipeline (9 Agents)

```
ContentExtractionAgent → OutlinePlannerAgent → ContentWriterAgent
    → LayoutSelectorAgent → VisualDecisionAgent
    → GraphicGeneratorAgent / ImageSearchAgent (parallel)
    → QualityReviewAgent
```

- **OrchestratorAgent** coordinates the pipeline, manages back-pressure loops
- **Back-pressure**: LayoutSelector↔ContentWriter (max 2 rounds), QualityReview→any Agent (max 2 rounds)
- Each agent uses ReAct pattern (max 5 internal loops), outputs JSON validated against per-agent JSON Schema
- Agent prompts are in English; all agents share a common output envelope: `{ agent, status, result, reasoning }`

### SVG Template System

- Templates are 1920×1080 SVG skeletons paired with Schema JSON files
- Slot-based injection: `slot-title`, `slot-bullets`, `slot-image`, `slot-chart`, etc.
- 12 built-in template categories: cover, toc, section-header, text, two-column, image-text, chart, timeline, comparison, quote, team, ending
- Templates live in a `templates/` directory, each with `{name}.svg` + `{name}.schema.json`

### Planned Directory Structure

```
app/
  api/v1/           # REST API routes (auth, projects, pipeline, chat, templates, export)
  (pages)/          # Next.js pages
lib/
  agents/           # Agent implementations + schemas + __mocks__/
  utils/            # SVG sanitizer, URL validator, retry, PDF cleaner, etc.
  prisma.ts         # Prisma client singleton
  __mocks__/        # Prisma mock for testing
components/         # React components (SlidePanel, ChatPanel, SvgPreview, etc.)
hooks/              # Custom React hooks
store/              # Zustand stores
prisma/
  schema.prisma     # 8 tables: User, Session, Project, Presentation, Slide, ChatMessage, AgentTrace, Template
templates/          # SVG template files + schema JSONs
uploads/            # Runtime: cache/, slides/, exports/
deploy/             # nginx.conf, ssl/, backup.sh, cleanup.sh
```

### API Structure

- REST API under `/api/v1/` with 8 modules: auth, users, projects, pipeline, chat, templates, export, health
- Pipeline uses SSE at `GET /api/v1/pipeline/stream/{projectId}` for real-time progress
- Chat endpoint `POST /api/v1/chat` for single-slide editing via natural language
- All authenticated endpoints require `Authorization: Bearer <JWT>`

### Database (8 tables)

User → Project → Presentation → Slide (with generatedSvg, contentJson)
Project → ChatMessage, AgentTrace
Template (standalone, seeded)

### Design System

- "Structured Fluidity" aesthetic with Intelligence Blue (#004ac6) as primary
- Manrope (headlines) + Inter (body) typography
- "No-Line" rule — use tonal differences instead of borders
- Glassmorphism surfaces, Tonal Layering elevation (no traditional drop shadows)
- Three-column editor: Navigation / Canvas / AI Intelligence

## Key Environment Variables

```env
# Required
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=<32+ char random string>
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat

# Optional
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
LLM_MOCK_ENABLED=false
UNSPLASH_ACCESS_KEY=
IMAGE_SEARCH_ENABLED=true
```

## Design Documents

All specs are in `docs/`:
- `ppt-agent-design.md` — Main design doc (product, agents, templates, data models, API, pages)
- `database-design.md` — Schema, indexes, migrations
- `api-design.md` — REST API endpoints, request/response formats
- `svg-template-spec.md` — SVG skeleton + Schema JSON specification
- `security-design.md` — Auth, input validation, SVG sanitization, SSRF
- `agent-prompt-design.md` — System prompts and JSON Schema for all 9 agents
- `error-handling.md` — Error classification, per-agent handling, back-pressure flows
- `performance-cache.md` — Performance targets, caching, optimization
- `third-party-integration.md` — LLM, Unsplash, pdf-parse, cheerio, sharp, pptxgenjs
- `deployment.md` — Docker, Compose, Nginx, backup, monitoring
- `testing-strategy.md` — Jest config, test categories, mock strategy

UI prototypes are in `ui-design/` and `interactive-prototypes/`.
