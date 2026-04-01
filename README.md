# CognitiveCanvas - AI-Powered Presentation Generation Platform

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

**CognitiveCanvas** is an AI-powered presentation generation system that transforms raw content (text, PDF, URLs) into polished, visually coherent slide decks in seconds through an intelligent 9-agent ReAct pipeline.

## 🎯 What It Does

- **Smart Content Extraction**: Automatically analyze and structure raw input (text, PDFs, web content)
- **Intelligent Outlining**: AI-driven narrative planning with slide sequencing
- **Adaptive Layout Selection**: Choose optimal slide templates based on content type
- **Visual Generation**: AI-assisted graphics, charts, and image integration
- **Quality Review**: Multi-pass validation with back-pressure refinement loops
- **Real-Time Feedback**: Watch the generation pipeline in action with live agent progress

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ 
- npm 9+ or yarn
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd ppt-agent

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local

# Edit .env.local with your LLM API credentials:
# - LLM_BASE_URL (e.g., https://api.openai.com/v1)
# - LLM_API_KEY (your API key)
# - LLM_MODEL (default: deepseek-chat, or gpt-4, qwen-max, etc.)

# 4. Initialize database
npx prisma migrate dev
npm run db:seed  # Loads demo user + sample templates

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo Credentials** (seeded):
- Email: `demo@cognitivecanvas.ai`
- Password: `demo123`

## 📖 Core Features

### Three-Column Workspace
- **Left**: Navigation (slides, outline, templates)
- **Center**: Canvas (high-fidelity slide editing, SVG rendering)
- **Right**: AI Intelligence Panel (contextual chat, editing tools, feedback)

### Multi-Agent Pipeline
```
ContentExtraction → Outline Planning → Content Writing
    → Layout Selection → Visual Decision
    → [Image Search | Graphic Generation] (parallel)
    → Quality Review
```

### Template System
- 12 built-in categories: Cover, ToC, Section Header, Text, Two-Column, Image+Text, Chart, Timeline, Comparison, Quote, Team, Ending
- SVG-based templates with slot-based content injection
- JSON Schema validation for type safety
- Create and save custom templates

### Smart Chat Editor
- Edit single slides with natural language ("Add a call-to-action", "Change the background color")
- Intent toggle (EDIT mode: modify existing content, ADD mode: new bullets/elements)
- Real-time slide preview
- Undo/redo history

### Export Formats
- PPTX (Microsoft PowerPoint)
- PDF (with speaker notes)
- HTML (web-shareable)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 19, TypeScript 6.0 |
| **State Management** | Zustand (UI), React Query (server state) |
| **Styling** | Tailwind CSS 4.2, PostCSS 8.5, Custom Design Tokens |
| **Database** | Prisma ORM 7.6 + SQLite (WAL mode) |
| **Authentication** | JWT (HS256, 7-day expiry) + bcrypt |
| **Streaming** | Server-Sent Events (SSE) for real-time agent progress |
| **LLM Integration** | OpenAI-compatible API (supports DeepSeek, Qwen, GPT-4, etc.) |
| **SVG Rendering** | @resvg/resvg-js + sharp for server-side optimization |
| **PPTX Export** | pptxgenjs for PowerPoint generation |
| **Content Parsing** | pdf-parse (PDFs), cheerio + axios (web scraping) |
| **Security** | DOMPurify (SVG sanitization), bcrypt (password hashing) |
| **Concurrency** | p-queue (configurable LLM request queuing) |
| **Testing** | Jest (configured, tests in progress) |
| **Deployment** | Docker + Docker Compose + Nginx |

## 📁 Project Structure

```
app/                           # Next.js App Router
├── api/v1/                    # REST API endpoints
│   ├── auth/                  # Login, register, logout
│   ├── projects/              # CRUD for projects & presentations
│   ├── pipeline/stream/[id]/   # SSE endpoint for agent progress
│   ├── chat/                  # Single-slide AI editing
│   ├── templates/             # Template browser & management
│   ├── export/                # PPTX/PDF/HTML generation
│   └── users/me/              # Current user profile
├── (auth)/                    # Public auth pages (login, register)
└── (workspace)/               # Protected workspace pages
    ├── page.tsx              # Projects dashboard
    ├── templates/page.tsx    # Template browser
    └── project/[id]/         # Project workspace
        ├── page.tsx          # Slide editor
        ├── setup/page.tsx    # Pre-generation configuration
        └── generating/page.tsx# Real-time generation view

components/
├── layout/ProductChrome.tsx   # Unified top nav + footer
└── ui/                        # Base components (Button, Input, Card, etc.)

lib/
├── api/client.ts              # Typed API client with auth headers
├── auth/jwt.ts                # Token generation & validation
├── middleware/auth.ts         # Protected route middleware
├── prisma.ts                  # Prisma client singleton
└── utils/                     # Validation, error formatting, SVG sanitization

hooks/
├── useAuth.ts                 # Authentication (login, register, logout)
└── useProjects.ts             # Project CRUD operations

store/
├── authStore.ts               # Zustand: auth state (token, user)
└── uiStore.ts                 # Zustand: UI state (sidebar, modals)

prisma/
├── schema.prisma              # Database schema (8 tables)
├── migrations/                # Schema migration history
└── seed.ts                    # Demo data seeding

docs/                          # Detailed design & architecture docs
├── ppt-agent-design.md        # System overview & architecture
├── api-design.md              # REST API specification
├── database-design.md         # Schema, indexes, relationships
├── svg-template-spec.md       # SVG template system specification
├── security-design.md         # Auth, validation, sanitization
├── agent-prompt-design.md     # AI agent prompts and schemas
├── error-handling.md          # Error classification & recovery
├── performance-cache.md       # Performance targets & optimization
├── testing-strategy.md        # Jest configuration & test patterns
├── third-party-integration.md # LLM, Unsplash, pdf-parse, etc.
└── deployment.md              # Docker, Nginx, SSL, backup

.github/
├── copilot-instructions.md    # AI agent development guide
└── workflows/                 # CI/CD pipelines (planned)

interactive-prototypes/        # Approved UI prototypes (reference)
templates/                     # SVG slide templates + schema JSON
```

## 💻 Development

### Available Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (port 3000)

# Production
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npx prisma migrate dev        # Create & apply migrations
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # Open prisma.io Studio GUI
npm run db:seed              # Reset & seed demo data

# Testing (planned)
npm run test                  # Run all tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report

# Docker
docker compose up -d --build # Build and run all services
```

### Development Workflow

1. **Pick a task** from the GitHub Project or issues
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Follow patterns** in [.github/copilot-instructions.md](.github/copilot-instructions.md)
4. **Test**: `npm run build` (production build must pass)
5. **Commit**: Use semantic commit messages
6. **Push & PR**: Open a pull request to `main`

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🔐 Authentication & Security

- **JWT-based**: 7-day expiry, HS256 signing algorithm
- **Password Security**: bcrypt hashing (cost factor 12)
- **SVG Sanitization**: DOMPurify whitelist (elements & attributes)
- **SSRF Protection**: URL validation for web scraping endpoints
- **Input Validation**: Type-safe validation via `lib/utils/validation.ts`

See [docs/security-design.md](docs/security-design.md) for detailed security model.

## 🎨 Design System

**Aesthetic**: "Structured Fluidity" with Intelligence Blue as primary

| Token | Value | Usage |
|-------|-------|-------|
| Primary Blue | `#004ac6` | CTAs, primary actions, focus states |
| Primary Container | `#2563eb` | Gradient overlays, secondary actions |
| Tertiary Purple | `#6a1edb` | Accents, agent status indicators |
| Surface Gray | `#f7f9fb` | Page backgrounds, panels |
| Font Family (Headlines) | Manrope (600/700/800) | h1, h2, h3 |
| Font Family (Body) | Inter (400/500/600/700) | Body text, UI labels |

**Constraints**:
- No drop shadows (elevation via tonal layering)
- Glass effect surfaces (`backdrop-blur-xl`)
- Rounded corners (22–28px)
- No-line rule (tonal differences instead of borders)

See `app/globals.css` for all design tokens and utilities.

## 📊 Database Schema

```
User
├── Session[]
├── Project[]
│   ├── Presentation[]
│   │   └── Slide[]
│   │       └── ContentJson, GeneratedSvg
│   ├── ChatMessage[]
│   └── AgentTrace[]
└── Template
```

**Key Tables**: User, Session, Project, Presentation, Slide, ChatMessage, AgentTrace, Template

See [docs/database-design.md](docs/database-design.md) for detailed schema.

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build and start all services
docker compose up -d --build

# Services:
# - Next.js app (port 3000)
# - Nginx reverse proxy (port 80/443)
# - SQLite with Volume mount
```

### Environment Variables

**Development** (`.env.local`):
```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-32-char-secret-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4
LLM_TIMEOUT=60000
LLM_MAX_CONCURRENCY=3
```

**Production** (`.env.production`):
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-production-secret
# ... other vars
```

See [docs/deployment.md](docs/deployment.md) for full deployment guide.

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Project overview for Claude AI agents |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Coding patterns & AI agent guidance |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Developer onboarding & workflow |
| [docs/ppt-agent-design.md](docs/ppt-agent-design.md) | System architecture & product design |
| [docs/api-design.md](docs/api-design.md) | REST API specification |
| [docs/database-design.md](docs/database-design.md) | Database schema & relationships |
| [docs/svg-template-spec.md](docs/svg-template-spec.md) | SVG template system |
| [docs/security-design.md](docs/security-design.md) | Security model & best practices |
| [docs/agent-prompt-design.md](docs/agent-prompt-design.md) | AI agent implementations |

## 🛣️ Roadmap

### Current (Phase 1: MVP)
- ✅ Core Next.js + TypeScript foundation
- ✅ JWT authentication
- ✅ Project & presentation CRUD
- ✅ Slide editor with AI chat
- ✅ SVG template system
- ✅ Real-time agent progress (SSE)
- 🚧 Agent implementations (mock → real)
- 🚧 LLM integration (OpenAI-compatible)

### Next (Phase 2: Enhancement)
- [ ] Testing infrastructure (Jest + React Testing Library)
- [ ] Advanced template customization
- [ ] Batch presentation generation
- [ ] Collaboration & sharing
- [ ] Version history & rollback
- [ ] Image generation integration (DALL-E, Midjourney)

### Future (Phase 3: Scale)
- [ ] Multi-language output
- [ ] Presentation analytics
- [ ] Team workspaces
- [ ] Custom brand kit management
- [ ] API for third-party integrations

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Setup instructions
- Development workflow
- Code style guidelines
- Testing requirements
- Deployment process

## 📜 License

MIT License — see [LICENSE](LICENSE) file for details.

## 💬 Support & Community

- **Issues**: Report bugs or request features on [GitHub Issues](../../issues)
- **Documentation**: See the [docs/](docs/) folder for detailed guides
- **Questions**: Check [CONTRIBUTING.md](CONTRIBUTING.md) troubleshooting section

## 🙏 Acknowledgments

- Approved interactive prototypes in `interactive-prototypes/` drive all UI architecture
- Design system inspired by Material Design 3 + Fluent Design
- Built with Next.js, React, and TypeScript
- Multi-agent orchestration pattern based on ReAct (Reasoning + Acting)

---

**CognitiveCanvas** — *Intelligent presentations, created instantly.* ✨

*Last Updated: April 2026*
