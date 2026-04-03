# Contributing to DeckGenie

Welcome! This document outlines how to set up, develop, and contribute to the DeckGenie presentation generation platform.

## Quick Start

### Prerequisites
- **Backend**: Go 1.21+
- **Frontend**: Node.js 18+ and npm 9+
- Git

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ppt-agent

# 2. Start backend
cd backend-go
go mod tidy
./start-dev.sh

# 3. Start frontend (in another terminal)
cd frontend-react
npm install
npm run dev
```

Your app is now live at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

**Test Account**:
- Email: `test@example.com`
- Password: `password123`

## Development Workflow

### Making Changes

1. **Pick a task** from GitHub Issues
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make your changes**:
   - Backend: Follow Go conventions, use GORM for database
   - Frontend: Use TypeScript strictly, follow React best practices
4. **Test locally**:
   - Backend: `go test ./...`
   - Frontend: `npm run build`
5. **Commit with semantic messages**: `feat: add slide thumbnail preview`
6. **Push and open a PR** against `main`

## Code Style

### Backend (Go)
- Follow standard Go formatting (`gofmt`)
- Use meaningful variable names
- Add comments for exported functions
- Handle errors explicitly
- Use GORM for database operations

### Frontend (React)
- Use TypeScript for all files
- Follow React hooks best practices
- Use functional components
- Keep components small and focused
- Use Tailwind CSS for styling

## Project Structure

### Backend
```
backend-go/
├── cmd/server/          # Entry point
├── internal/
│   ├── handlers/        # HTTP handlers
│   ├── middleware/      # Middleware
│   ├── models/          # Database models
│   └── utils/           # Utilities
└── data/                # SQLite database
```

### Frontend
```
frontend-react/
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom hooks
│   ├── store/           # State management
│   └── lib/             # API client
└── public/              # Static assets
```

## Testing

### Backend
```bash
cd backend-go
go test ./...
go test -v ./internal/handlers
```

### Frontend
```bash
cd frontend-react
npm run build  # Check for TypeScript errors
npm run lint   # Run linter
```

## Common Tasks

### Adding a New API Endpoint

1. Define the model in `backend-go/internal/models/models.go`
2. Create handler in `backend-go/internal/handlers/`
3. Register route in `backend-go/cmd/server/main.go`
4. Add API call in `frontend-react/src/lib/api.ts`
5. Create React hook in `frontend-react/src/hooks/`

### Adding a New Page

1. Create component in `frontend-react/src/pages/`
2. Add route in `frontend-react/src/App.tsx`
3. Update navigation in `frontend-react/src/components/ProductChrome.tsx`

## Commit Message Format

Use semantic commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add project delete functionality
fix: resolve login token expiration issue
docs: update API documentation
```

## Pull Request Guidelines

1. **Title**: Clear and descriptive
2. **Description**: Explain what and why
3. **Testing**: Describe how you tested
4. **Screenshots**: Include for UI changes
5. **Breaking Changes**: Clearly document

## Getting Help

- Check existing issues and documentation
- Ask questions in GitHub Discussions
- Review code in `archive-nextjs/` for reference

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
