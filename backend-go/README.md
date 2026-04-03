# PPT Agent Backend (Go)

Go backend service for the PPT Agent application.

## Tech Stack

- **Framework**: Gin (HTTP router)
- **Database**: SQLite + GORM
- **Auth**: JWT (HS256) + bcrypt
- **Language**: Go 1.22+

## Project Structure

```
backend-go/
├── cmd/
│   └── server/          # Main application entry point
├── internal/
│   ├── database/        # Database initialization
│   ├── handlers/        # HTTP request handlers
│   ├── middleware/      # Middleware (auth, etc.)
│   ├── models/          # Database models
│   └── services/        # Business logic
├── pkg/
│   └── utils/           # Utility functions (JWT, password, response)
├── config/              # Configuration files
├── data/                # SQLite database files (gitignored)
├── go.mod
└── .env.example
```

## Setup

1. **Install Go 1.22+**

2. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** and set your configuration:
   - `JWT_SECRET`: Change to a secure random string (32+ chars)
   - `DATABASE_URL`: SQLite database path
   - `PORT`: Server port (default: 8080)

4. **Install dependencies**:
   ```bash
   go mod download
   ```

5. **Run the server**:
   ```bash
   go run cmd/server/main.go
   ```

   Or build and run:
   ```bash
   go build -o bin/server cmd/server/main.go
   ./bin/server
   ```

## API Endpoints

### Public Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/health` - Health check

### Protected Endpoints (require `Authorization: Bearer <token>`)

- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/projects` - List projects (paginated)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

## Development

### Run with hot reload (using air):

```bash
# Install air
go install github.com/cosmtrek/air@latest

# Run
air
```

### Database migrations:

GORM auto-migrates on startup. The database schema is defined in `internal/models/models.go`.

## TODO

- [ ] Implement remaining API endpoints (presentations, slides, templates, etc.)
- [ ] Add SSE support for pipeline streaming
- [ ] Add file upload handling
- [ ] Add LLM integration
- [ ] Add tests
- [ ] Add Docker support
