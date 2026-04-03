# DeckGenie - AI-Powered Presentation Generation Platform

![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

**DeckGenie** is an AI-powered presentation generation system that transforms raw content (text, PDF, URLs) into polished, visually coherent slide decks through an intelligent multi-agent pipeline.

## 🎯 What It Does

- **Smart Content Extraction**: Automatically analyze and structure raw input (text, PDFs, web content)
- **Intelligent Outlining**: AI-driven narrative planning with slide sequencing
- **Adaptive Layout Selection**: Choose optimal slide templates based on content type
- **Visual Generation**: AI-assisted graphics, charts, and image integration
- **Quality Review**: Multi-pass validation with back-pressure refinement loops
- **Real-Time Feedback**: Watch the generation pipeline in action with live agent progress

## 🏗️ Architecture

This project uses a **separated frontend-backend architecture**:

- **Backend**: Go + Gin + GORM + SQLite (in `backend-go/`)
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4 (in `frontend-react/`)

### Why Separated Architecture?

- **Independent Scaling**: Frontend and backend can be deployed and scaled separately
- **Technology Flexibility**: Use the best tool for each layer
- **Team Collaboration**: Frontend and backend teams can work independently
- **Clear Boundaries**: Well-defined API contracts between layers

## 🚀 Quick Start

### Prerequisites

- **Backend**: Go 1.21+
- **Frontend**: Node.js 18.17+ and npm 9+
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd ppt-agent

# 2. Start Backend (Terminal 1)
cd backend-go
go mod tidy
./start-dev.sh

# 3. Start Frontend (Terminal 2)
cd frontend-react
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

### Default Test Account

```
Email: test@example.com
Password: password123
```

## 📁 Project Structure

```
ppt-agent/
├── backend-go/              # Go backend (Gin + GORM + SQLite)
│   ├── cmd/server/          # Main entry point
│   ├── internal/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Database models
│   │   └── utils/           # Utilities
│   ├── data/                # SQLite database
│   └── start-dev.sh         # Development startup script
│
├── frontend-react/          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # API client and utilities
│   ├── public/              # Static assets
│   └── package.json
│
├── docs/                    # Architecture documentation
├── ui-design/               # Design mockups
├── interactive-prototypes/  # HTML prototypes
└── archive-nextjs/          # Archived Next.js full-stack code
```

## 🔧 Development

### Backend Development

```bash
cd backend-go

# Run with auto-reload (if using air)
air

# Or run directly
go run cmd/server/main.go

# Run tests
go test ./...

# Build for production
go build -o server cmd/server/main.go
```

### Frontend Development

```bash
cd frontend-react

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🌟 Features

### Current Features (UI Complete)

- ✅ User authentication (register, login, logout)
- ✅ Project management (create, list, delete)
- ✅ Project setup page (content upload UI)
- ✅ Slide editor interface (three-column layout)
- ✅ Template management hub
- ✅ Layout pattern management (UI)
- ✅ Asset library management (UI)

### Planned Features

- ⏳ File upload and processing (PDF, DOCX, TXT)
- ⏳ AI content analysis and extraction
- ⏳ Slide generation pipeline
- ⏳ Real-time AI chat assistant
- ⏳ Export to PPTX
- ⏳ Template customization
- ⏳ Collaborative editing

## 🎨 Design System

DeckGenie uses a modern, tech-minimalist design:

- **Colors**: Blue primary (#004ac6), with purple and emerald accents
- **Typography**: Manrope (headings) + Inter (body)
- **Style**: Clean, bright, with subtle gradients and shadows
- **Icons**: Material Symbols Outlined

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/users/me` - Get current user

### Project Endpoints

- `GET /api/v1/projects` - List projects (with pagination)
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

All authenticated endpoints require `Authorization: Bearer <token>` header.

## 🔐 Security

- JWT authentication (HS256, 7-day expiry)
- bcrypt password hashing (cost=12)
- CORS enabled for cross-origin requests
- Input validation on all endpoints

## 🚢 Deployment

### Backend Deployment

```bash
cd backend-go
go build -o server cmd/server/main.go
./server
```

### Frontend Deployment

```bash
cd frontend-react
npm run build
# Deploy dist/ folder to static hosting (Vercel, Netlify, etc.)
```

## 📝 Environment Variables

### Backend (.env)

```env
PORT=8080
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/ppt-agent.db
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspired by modern SaaS applications
- Built with love using Go and React
- AI-powered features coming soon

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Note**: The original Next.js full-stack implementation has been archived in `archive-nextjs/` directory. The current active codebase uses separated Go backend and React frontend.
