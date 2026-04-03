# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DeckGenie** — an AI-powered PPT auto-generation system using a separated frontend-backend architecture. Users provide raw content (text/PDF/URL), and the system generates complete slide decks through an intelligent multi-agent pipeline.

**Current state**: Frontend UI complete, backend API partially implemented. AI generation pipeline planned for future phases.

## Tech Stack

### Backend (Go)
- **Framework**: Gin (HTTP router)
- **Database**: GORM + SQLite (WAL mode)
- **Auth**: JWT (HS256, 7-day expiry) + bcrypt (cost=12)
- **API**: RESTful with JSON responses
- **CORS**: Enabled for cross-origin requests

### Frontend (React)
- **Framework**: React 19 + Vite 8 + TypeScript 5
- **Routing**: React Router v7
- **State Management**: Zustand (auth) + React Query (server state)
- **Styling**: Tailwind CSS 4 with custom design tokens
- **HTTP Client**: Axios with interceptors
- **Icons**: Material Symbols Outlined

## Commands

### Backend
```bash
cd backend-go
go run cmd/server/main.go    # Start dev server
go build -o server cmd/server/main.go  # Build
go test ./...                 # Run tests
```

### Frontend
```bash
cd frontend-react
npm run dev                   # Start dev server (port 5173)
npm run build                 # Production build
npm run preview               # Preview production build
```

### Both
```bash
./start-dev.sh               # Start both frontend and backend
```

## Architecture

### Backend Structure
```
backend-go/
├── cmd/server/main.go       # Entry point
├── internal/
│   ├── handlers/            # HTTP handlers (auth, projects)
│   ├── middleware/          # Auth middleware
│   ├── models/              # Database models (10 tables)
│   └── utils/               # Utilities (response, JWT)
└── data/                    # SQLite database
```

### Frontend Structure
```
frontend-react/
├── src/
│   ├── pages/               # Page components
│   ├── components/          # Reusable components
│   ├── hooks/               # Custom hooks (useAuth, useProjects)
│   ├── store/               # Zustand stores
│   └── lib/                 # API client, utilities
└── public/                  # Static assets
```

## Database Models

10 tables: User, Session, Project, Presentation, Slide, ChatMessage, AgentTrace, Template, LayoutPattern, Asset

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/users/me` - Get current user

### Projects
- `GET /api/v1/projects` - List projects (with pagination)
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

All authenticated endpoints require `Authorization: Bearer <token>` header.

## Design System

- **Primary Color**: Blue (#004ac6)
- **Accents**: Purple, Emerald
- **Typography**: Manrope (headings) + Inter (body)
- **Style**: Clean, bright, tech-minimalist
- **Icons**: Material Symbols Outlined

## Key Design Decisions

### Separated Architecture
- Backend and frontend are completely independent
- Clear API contracts between layers
- Can be deployed and scaled separately
- Different teams can work independently

### Technology Choices
- **Go backend**: Fast, simple, excellent for APIs
- **React frontend**: Modern, component-based, great ecosystem
- **SQLite**: Simple, file-based, perfect for MVP
- **JWT auth**: Stateless, scalable authentication

## Development Guidelines

1. **Backend**: Follow Go conventions, use GORM for database operations
2. **Frontend**: Use TypeScript strictly, follow React best practices
3. **API**: RESTful design, consistent response format
4. **Security**: Validate all inputs, use bcrypt for passwords, JWT for auth
5. **Code Style**: Clean, readable, well-commented

## Planned Features

- File upload and processing (PDF, DOCX, TXT)
- AI content analysis and extraction
- Slide generation pipeline
- Real-time AI chat assistant
- Export to PPTX
- Template customization

## Notes

- Original Next.js full-stack code archived in `archive-nextjs/`
- Current focus: Complete backend APIs and integrate AI features
- Design prototypes available in `interactive-prototypes/`
- Detailed architecture docs in `docs/` directory
