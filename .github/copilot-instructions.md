# CognitiveCanvas AI Agent Instructions

**Foundation Reference**: See [CLAUDE.md](../CLAUDE.md) for the authoritative project overview, tech stack, and architecture.

This file accelerates AI-assisted development by codifying patterns, workflows, and constraints specific to the CognitiveCanvas PPT generation platform.

---

## 🎯 System Overview

**CognitiveCanvas** is an AI-powered presentation generation system that transforms raw content (text/PDF/URL) into structured, visually coherent slide decks through a 9-agent ReAct pipeline.

**Current Implementation Status**:
- ✅ Core Next.js 14 + TypeScript full-stack foundation  
- ✅ SQLite persistence + Prisma ORM (migration-ready for PostgreSQL)
- ✅ Multi-agent orchestration framework (mock agent implementations in place)
- ✅ Prototype-aligned frontend UI with three-column editor layout
- 🚧 Agent implementations still at mock/skeleton level
- 🚧 Production concurrency and LLM integration partially stubbed

See [docs/ppt-agent-design.md](../docs/ppt-agent-design.md) for complete system design.

---

## 📂 Directory Structure Quick Reference

```
app/                          # Next.js App Router (RSC + server actions)
├── api/v1/                   # REST endpoints (auth, projects, pipeline, chat, templates, export)
├── (auth)/                   # Public pages (login, register)
├── (workspace)/              # Protected routes (projects dashboard, setup, editor, templates)
└── globals.css               # Design system tokens, typography, utilities

components/
├── layout/ProductChrome.tsx   # Unified top nav, footer, product shell
└── ui/                        # Base components (Button, Input, Card, Spinner, Badge)

lib/
├── api/client.ts             # Client-side API abstraction + headers
├── auth/jwt.ts               # Token generation, validation, payload structure
├── middleware/auth.ts        # Server middleware for request protection
├── prisma.ts                 # Singleton Prisma client
└── utils/                    # Validation, error formatting, SVG sanitization, etc.

hooks/
├── useAuth.ts                # Auth hooks (login, register, logout, currentUser)
└── useProjects.ts            # Project CRUD hooks (fetch, create, update, delete)

store/
├── authStore.ts              # Zustand: token, user, auth state
└── uiStore.ts                # Zustand: sidebar, modal, editor state

prisma/
├── schema.prisma             # 8 tables: User, Session, Project, Presentation, Slide, ChatMessage, AgentTrace, Template
├── seed.ts                   # Seeding with demo user + templates
└── migrations/               # Prisma migration history

docs/                         # Design documentation (read-only reference)
├── ppt-agent-design.md       # Product, agent pipeline, templates, data model
├── api-design.md             # REST API specification
├── database-design.md        # Schema, indexes, relationships
├── svg-template-spec.md      # SVG slot injection, schema validation
├── security-design.md        # Auth, input validation, SSRF protection, SVG sanitization
├── agent-prompt-design.md    # System prompts + JSON schemas for 9 agents
├── error-handling.md         # Error classification, recovery flows
├── performance-cache.md      # Caching strategy, optimization targets
├── third-party-integration.md # LLM, Unsplash, pdf-parse, cheerio usage
├── testing-strategy.md       # Jest config, test categories, mocking patterns
└── deployment.md             # Docker, Compose, Nginx, SSL, backup

interactive-prototypes/       # HTML prototypes (approved by design)
├── projects.html             # Dashboard with project cards, creation modal
├── setup.html                # Three-column setup flow (input, config, sidebar)
├── generating.html           # Agent timeline, outline table, intelligence panel
├── editor.html               # Three-column editor (thumbnails, canvas, chat)
└── templates.html            # Template browser with detail inspector

ui-design/                    # Figma source design files (reference)
```

---

## ⚙️ Development Commands

```bash
# Development
npm run dev                   # Start Next.js dev server (http://localhost:3000)

# Building & Deployment
npm run build                 # Production build (type-checked, optimized)

# Testing (planned, not yet implemented)
npm run test                  # Server tests (Jest, Node environment)
npm run test:client           # Client tests (Jest, jsdom environment)
npm run test:watch            # Watch mode for both

# Database
npx prisma migrate dev        # Apply pending migrations
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # GUI to inspect/edit database
npm run db:seed              # Reset DB and seed demo user + templates

# Docker (production)
docker compose up -d --build # Build and start all containers
```

---

## 🔑 Essential Patterns

### 1. **API Routes Follow `/api/v1/{resource}/` Convention**

All REST endpoints are under `/api/v1/` with consistent response format:

```typescript
// Success (from lib/utils/api.ts)
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Pagination
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// Error (always wrapped)
{ success: false, error: { code: "NOT_FOUND", message: "...", details?: ... } }
```

Every API route imports and uses helper functions from `lib/utils/api.ts`:
- `ok(data)` → 200
- `created(data)` → 201
- `noContent()` → 204
- `paginated(data, page, pageSize, total)` → paginated response

### 2. **Authentication & Authorization**

All protected endpoints use `authMiddleware(request)`:

```typescript
import { authMiddleware } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) return auth;  // 401/403
  
  const userId = auth.userId;  // Now safe to use
  // ... fetch user's resources
}
```

JWT tokens:
- Generated with `lib/auth/jwt.ts` (HS256, 7-day expiry)
- Stored in `authStore.ts` (Zustand, persisted to localStorage)
- Attached to all API calls via `lib/api/client.ts`

### 3. **Data Fetching: React Query + Custom Hooks**

Never fetch directly in components. Use hooks from `hooks/useProjects.ts` and `hooks/useAuth.ts`:

```typescript
// ✅ Correct
const { data: projects, isLoading, error } = useProjects();
const createProject = useCreateProject();

// ❌ Avoid
const [projects, setProjects] = useState(null);
useEffect(() => {
  fetch("/api/v1/projects").then(res => res.json()).then(setProjects);
}, []);
```

Hooks handle request invalidation, error formatting, auth headers automatically.

### 4. **UI Components: Base Layer in `/components/ui/`**

All interactive UI elements are in `components/ui/{Button,Input,Card,Badge,Spinner}.tsx`.

**Pattern**: Forwardref + Tailwind classes, no external UI libraries.

```typescript
// ✅ Correct
import { Button, Input, Card } from "@/components/ui";
<Button variant="primary" size="md" onClick={...}>Action</Button>

// ❌ Avoid
import MuiButton from "@mui/material/Button";
<button className="...">Action</button>  // Use Button component instead
```

Component variants are defined in the component file's `variants` object. All use Tailwind's design system tokens from `app/globals.css`.

### 5. **Pages & Layouts: Three-Column Editor Pattern**

The core editor and setup flows follow a proven three-column layout (refined through iterative prototype work):

**Projects Dashboard** (`app/page.tsx`):
- Unified top nav (ProductTopBar from ProductChrome.tsx)
- Hero section with stats
- Grid of project cards with gradient backgrounds
- Create project modal overlay

**Setup Flow** (`app/project/[id]/setup/page.tsx`):
- **Left**: Contextual info + visual inspiration
- **Center**: Input forms (title, description, raw content, URL)
- **Right**: Configuration panel (slide count slider, tone toggle, audience select)

**Generating View** (`app/project/[id]/generating/page.tsx`):
- **Main**: Agent timeline + slide deck outline table
- **Right**: Intelligence panel, confidence score, event log

**Editor** (`app/project/[id]/page.tsx`):
- **Left**: Slide thumbnails (hidden on mobile)
- **Center**: Large canvas with SVG rendering
- **Right**: AI chat assistant with intent toggle (EDIT/ADD)

All layout pages import `ProductTopBar` and `ProductFooter` from `components/layout/ProductChrome.tsx` for consistency.

### 6. **Design System Tokens**

All colors, spacing, and typography are driven by CSS custom properties in `app/globals.css`:

```css
--color-primary: #004ac6;           /* Intelligence Blue */
--color-tertiary: #6a1edb;          /* Accent Purple */
--color-surface: #f7f9fb;           /* Light background */
--color-on-surface: #191c1e;        /* Dark text */
```

Tailwind extends these via `tailwind.config.ts`. Use semantic Tailwind classes, never hardcoded hex values:

```jsx
// ✅ Correct
<div className="bg-primary text-white rounded-2xl shadow-lg">
<button className="bg-gradient-to-br from-primary to-primary-container">

// ❌ Avoid
<div style={{ backgroundColor: "#004ac6", color: "white" }}>
<button className="bg-[#2563eb]">
```

---

## 🚀 Common Workflows

### Creating a New API Endpoint

1. **File placement**: `app/api/v1/{resource}/route.ts`
2. **Always use authMiddleware** unless public (health check)
3. **Import response helpers** from `lib/utils/api.ts`
4. **Validate input** with functions from `lib/utils/validation.ts`
5. **Catch errors** and return formatted response via `lib/utils/error.ts`

```typescript
import { authMiddleware } from "@/lib/middleware/auth";
import { ok, created } from "@/lib/utils/api";
import { requireString } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const name = requireString(body.name, "name");
    
    const result = await prisma.project.create({
      data: { userId: auth.userId, name }
    });
    
    return created(result);
  } catch (error) {
    const { formatError } = await import("@/lib/utils/error");
    return Response.json(formatError(error), { status: 500 });
  }
}
```

### Adding a New Page

1. **File placement**: `app/{route}/page.tsx` (App Router)
2. **Mark as "use client"** if interactive
3. **Import ProductTopBar + ProductFooter** for consistent shell
4. **Use custom hooks** for data fetching
5. **Use base UI components** from `components/ui/`
6. **Follow three-column layout** if editor/workspace page

```typescript
"use client";

import { ProductTopBar, ProductFooter } from "@/components/layout/ProductChrome";
import { Button, Card, Spinner } from "@/components/ui";
import { useProjects } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";

export default function MyPage() {
  const { data: projects, isLoading } = useProjects();
  const user = useAuthStore(state => state.user);
  
  return (
    <div className="min-h-screen flex flex-col">
      <ProductTopBar activeNav="projects" userLabel={user?.name} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Page content */}
      </main>
      <ProductFooter />
    </div>
  );
}
```

### Updating a React Hook

All data-fetching hooks are in `hooks/` and follow React Query conventions:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<ProjectListItem[]>("/projects"),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/projects", data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
```

---

## ⚠️ Anti-Patterns & Hard Constraints

### ❌ DO NOT

1. **Hardcode API endpoints**: Use `api.get()`, `api.post()` from `lib/api/client.ts`
2. **Fetch directly in components**: Use custom hooks from `hooks/`
3. **Skip type checking**: Always provide TypeScript types for API responses
4. **Use temporary auth logic**: Always use authMiddleware + JWT from `lib/auth/jwt.ts`
5. **Import UI from external libraries**: All UI goes through base components in `components/ui/`
6. **Create inline SVG in components**: SVG rendering is centralized in template system
7. **Use CSS-in-JS**: All styles via Tailwind, design tokens in `app/globals.css`
8. **Mutate Zustand state directly**: Use provided setters (setAuth, clearAuth, etc.)
9. **Skip error handling in API routes**: Always catch, format, and return via `lib/utils/error.ts`
10. **Deploy without build**: Always test with `npm run build` before deployment

### ✅ DO

1. **Validate all user input** via `lib/utils/validation.ts` functions
2. **Respect the three-column layout** for editor/workspace pages
3. **Use semantic color classes** (`bg-primary`, `text-on-surface`)
4. **Link to design docs** when implementing features from specs
5. **Test API changes** with curl/Postman before integrating
6. **Use React Query invalidation** to keep UI in sync
7. **Provide loading/error states** in UI (Spinner, error toast, etc.)
8. **Structure commits by feature**, not by file type
9. **Update docs/** if changing architecture or APIs
10. **Check for existing hooks/utils** before creating duplicates

---

## 📋 Implementation Status & Stubs

### Recent Major Work (Session 1)
- ✅ Rebuilt all core pages (projects, setup, generating, editor) to match **approved interactive prototypes**
- ✅ Created unified ProductChrome shell (top nav, footer)
- ✅ Added Templates browser page (`app/templates/page.tsx`)
- ✅ Upgraded Button, Input, Card components to match design system
- ✅ Production build passes (`npm run build`)

### Current Stubs (Mock Implementations)
These need real implementation as you build out the backend:

1. **Agent Pipeline** (`app/api/v1/pipeline/stream/[id]/route.ts`)
   - Currently sends mock events on a timer
   - TODO: Hook to actual agent orchestration service
   - Link: [docs/agent-prompt-design.md](../docs/agent-prompt-design.md)

2. **Chat Endpoint** (`app/api/v1/chat/route.ts`)
   - Randomly selects from canned responses
   - TODO: Integrate with AI agent for slide editing
   - Link: [docs/agent-prompt-design.md](../docs/agent-prompt-design.md)

3. **LLM Integration**
   - Stub: Uses OpenAI SDK but no real calls yet
   - TODO: Implement concurrency queue (p-queue), model switching
   - Link: [docs/third-party-integration.md](../docs/third-party-integration.md)

4. **SVG Rendering** (client-side)
   - Currently uses dangerouslySetInnerHTML
   - TODO: Migrate to @resvg/resvg-js for server-side rendering
   - Link: [docs/svg-template-spec.md](../docs/svg-template-spec.md)

### Testing (Not Yet Implemented)
- Jest + React Testing Library configured but no test files
- TODO: Add unit tests for API routes, hooks, utilities
- TODO: Add component tests for UI and page layouts
- Link: [docs/testing-strategy.md](../docs/testing-strategy.md)

---

## 🔗 Key Documentation References

When implementing features, refer to these docs **by linking, not duplicating**:

- **Product & Architecture**: [docs/ppt-agent-design.md](../docs/ppt-agent-design.md)
- **REST API**: [docs/api-design.md](../docs/api-design.md)
- **Database Schema**: [docs/database-design.md](../docs/database-design.md)
- **SVG & Templates**: [docs/svg-template-spec.md](../docs/svg-template-spec.md)
- **Security**: [docs/security-design.md](../docs/security-design.md)
- **Agent Design**: [docs/agent-prompt-design.md](../docs/agent-prompt-design.md)
- **Error Handling**: [docs/error-handling.md](../docs/error-handling.md)
- **Performance**: [docs/performance-cache.md](../docs/performance-cache.md)
- **3rd Party Integrations**: [docs/third-party-integration.md](../docs/third-party-integration.md)
- **Testing**: [docs/testing-strategy.md](../docs/testing-strategy.md)
- **Deployment**: [docs/deployment.md](../docs/deployment.md)

---

## 🎨 Design System Quick Reference

### Colors
```
Primary Blue (#004ac6) → Background, CTAs, focus states
Primary Container (#2563eb) → Gradient overlays, secondary actions
Tertiary Purple (#6a1edb) → Accents, agent status indicators
Surface Gray (#f7f9fb) → Page background
White (#ffffff) → Cards, panels, modals
```

### Typography
```
Manrope (600/700/800) → Headlines (h1, h2, h3)
Inter (400/500/600/700) → Body text, UI labels
Font sizes via Tailwind: text-sm, text-base, text-lg, text-xl, text-2xl, etc.
```

### Spacing (8px base unit)
Tailwind spacing scale: px-4, py-3, gap-6, mb-8, etc. (inherited from Tailwind defaults)

### Elevation & Surface Treatment
- No drop shadows (design constraint)
- Use tonal layering: transparent overlays + gradient backgrounds
- Glass effect: `bg-white/80 backdrop-blur-xl`
- Cards: rounded-[28px] with subtle ring or shadow-sm

### Icons
Material Symbols Outlined (wght 500) via Google Fonts CDN

---

## 🤖 For AI Agents

When working on this codebase, use this checklist:

- [ ] Have I checked CLAUDE.md for system overview?
- [ ] Does the change respect the API response format (success/data/error)?
- [ ] Are all user inputs validated via lib/utils/validation.ts?
- [ ] Is authentication required? If so, did I use authMiddleware?
- [ ] Does the page import ProductTopBar and ProductFooter?
- [ ] Did I use base UI components (Button, Input, Card)?
- [ ] Are colors/spacing Tailwind tokens, not hardcoded?
- [ ] Have I tested the change with `npm run build`?
- [ ] Did I update docs/ if changing architecture?
- [ ] Are there existing hooks/utils I should reuse?

---

## 📞 Getting Help

If a pattern isn't clear:
1. Check CLAUDE.md for foundational context
2. Search docs/ for the feature area
3. Look at existing similar implementations (e.g., projects API + hook for reference when building another resource)
4. Check git history/commits for patterns applied in past work

---

**Last Updated**: April 2026  
**Format**: Markdown (UTF-8)  
**Audience**: AI agents (Claude, Copilot, etc.) + Human developers
