# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CognitiveCanvas** — an AI-powered PPT auto-generation Web system using a multi-Agent + ReAct architecture. Users provide raw content (text/PDF/URL), and the system generates complete slide decks through a pipeline of 11 specialized AI agents.

**Current state**: Design/specification phase. No implementation code exists yet. The repository contains design documents and HTML prototypes.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript (full-stack)
- **Database**: SQLite + Prisma ORM (WAL mode, PostgreSQL migration path planned)
- **Auth**: JWT (HS256, 7-day expiry) + bcrypt (cost=12)
- **LLM**: OpenAI-compatible API via `openai` SDK (model-agnostic: DeepSeek, Qwen, GPT)
- **Vision LLM**: GPT-4V / Claude 3.5 Sonnet / Qwen-VL (for image recognition in template management)
- **Task Queue**: BullMQ or p-queue (async processing for large files)
- **State**: React Query (server state) + Zustand (UI state)
- **Streaming**: SSE (Server-Sent Events) for real-time agent progress
- **SVG Rendering**: @resvg/resvg-js + sharp (SVG→PNG)
- **Image Processing**: sharp (compression, conversion, cropping)
- **PPTX Parsing**: pptxgenjs or officegen (for template asset extraction)
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

### Multi-Agent Pipeline (11 Agents)

```
ContentExtractionAgent → OutlinePlannerAgent → ContentWriterAgent
    → LayoutSelectorAgent → VisualDecisionAgent
    → AssetMatcherAgent → GraphicGeneratorAgent / ImageSearchAgent (parallel)
    → SVGRendererAgent → QualityReviewAgent
```

- **OrchestratorAgent** coordinates the pipeline, manages back-pressure loops
- **LayoutPatternExtractorAgent** (template management): extracts layout patterns from uploaded images via Vision LLM
- **AssetClassifierAgent** (template management): classifies and tags assets extracted from PPT files
- **Back-pressure**: LayoutSelector↔ContentWriter (max 2 rounds), QualityReview→any Agent (max 2 rounds)
- Each agent uses ReAct pattern (max 5 internal loops), outputs JSON validated against per-agent JSON Schema
- Agent prompts are in English; all agents share a common output envelope: `{ agent, status, result, reasoning }`

### Template Management System

**Layout Pattern System**:
- Users upload layout screenshots + descriptions
- Vision LLM recognizes structure and generates LayoutPattern JSON
- Patterns stored in database with parameterized definitions (grid/flex/columns)
- LLM dynamically selects patterns and decides parameters (e.g., 2-5 columns) based on content

**Asset Library System**:
- Users upload company PPT files (e.g., 466-page asset library)
- Async task queue extracts images/shapes/charts page-by-page
- Vision LLM classifies assets (icon/illustration/chart/decoration) and generates semantic tags
- Assets stored in database with keywords for matching
- AssetMatcherAgent matches content to assets using keyword/tag/category scoring

### SVG Template System

- Templates are 1920×1080 SVG skeletons paired with Schema JSON files
- Slot-based injection: `slot-title`, `slot-bullets`, `slot-image`, `slot-chart`, etc.
- 12 built-in template categories: cover, toc, section-header, text, two-column, image-text, chart, timeline, comparison, quote, team, ending
- Templates live in a `templates/` directory, each with `{name}.svg` + `{name}.schema.json`

### Planned Directory Structure

```
app/
  api/v1/           # REST API routes (auth, projects, pipeline, chat, templates, export, layout-patterns, assets)
  (pages)/          # Next.js pages
lib/
  agents/           # Agent implementations + schemas + __mocks__/
  layout/           # Layout pattern loader and types
  assets/           # Asset loader and matching logic
  svg/              # SVG layout calculator and builder
  utils/            # SVG sanitizer, URL validator, retry, PDF cleaner, etc.
  prisma.ts         # Prisma client singleton
  __mocks__/        # Prisma mock for testing
components/         # React components (SlidePanel, ChatPanel, SvgPreview, etc.)
hooks/              # Custom React hooks
store/              # Zustand stores
prisma/
  schema.prisma     # 10 tables: User, Session, Project, Presentation, Slide, ChatMessage, AgentTrace, Template, LayoutPattern, Asset
layout-patterns/    # Layout pattern JSON definitions
templates/          # SVG template files + schema JSONs
uploads/            # Runtime: cache/, slides/, exports/, assets/
deploy/             # nginx.conf, ssl/, backup.sh, cleanup.sh
```

### API Structure

- REST API under `/api/v1/` with 10 modules: auth, users, projects, pipeline, chat, templates, export, health, layout-patterns, assets
- Pipeline uses SSE at `GET /api/v1/pipeline/stream/{projectId}` for real-time progress
- Chat endpoint `POST /api/v1/chat` for single-slide editing via natural language
- Template management endpoints:
  - `POST /api/v1/layout-patterns` - Upload image + description, Vision LLM generates LayoutPattern
  - `POST /api/v1/assets/upload-ppt` - Upload PPT, async extraction task
  - `GET /api/v1/assets/tasks/:taskId` - Query extraction progress
- All authenticated endpoints require `Authorization: Bearer <JWT>`

### Database (10 tables)

User → Project → Presentation → Slide (with generatedSvg, contentJson)
Project → ChatMessage, AgentTrace
Template (standalone, seeded)
LayoutPattern (user-created layout definitions)
Asset (extracted from company PPT files)

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
VISION_LLM_MODEL=gpt-4-vision-preview  # For template management image recognition

# Optional
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
LLM_MOCK_ENABLED=false
UNSPLASH_ACCESS_KEY=
IMAGE_SEARCH_ENABLED=true
ASSET_EXTRACTION_CONCURRENCY=3  # Parallel Vision LLM calls for asset classification
```

## Design Documents

All specs are in `docs/architecture/`:
- `ppt-agent-design.md` — Main design doc (product, agents, templates, data models, API, pages, template management system)
- `database-design.md` — Schema, indexes, migrations
- `api-design.md` — REST API endpoints, request/response formats
- `svg-template-spec.md` — SVG skeleton + Schema JSON specification
- `security-design.md` — Auth, input validation, SVG sanitization, SSRF
- `agent-prompt-design.md` — System prompts and JSON Schema for all 11 agents
- `error-handling.md` — Error classification, per-agent handling, back-pressure flows
- `performance-cache.md` — Performance targets, caching, optimization
- `third-party-integration.md` — LLM, Vision LLM, Unsplash, pdf-parse, cheerio, sharp, pptxgenjs
- `deployment.md` — Docker, Compose, Nginx, backup, monitoring
- `testing-strategy.md` — Jest config, test categories, mock strategy

UI prototypes are in `ui-design/` and `interactive-prototypes/`.

## Key Design Decisions

### Template Management Approach
- **No visual template editor**: LLM dynamically decides layout parameters (columns, spacing) based on content
- **Image recognition workflow**: Users upload layout screenshots → Vision LLM extracts structure → generates LayoutPattern JSON
- **Asset extraction**: Company PPT files processed asynchronously → Vision LLM classifies and tags → stored in searchable database
- **Dynamic matching**: AssetMatcherAgent scores assets using keyword (0.3) + tag (0.2) + category (0.2) matching

### Implementation Phases
1. **Phase 1**: Template Management System (5-7 days) - Layout pattern & asset library management pages
2. **Phase 2**: Dynamic Layout System (10-12 days) - AssetMatcherAgent, SVGRendererAgent, LayoutSelectorAgent enhancements
