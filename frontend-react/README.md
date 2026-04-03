# PPT Agent Frontend (React)

React frontend for the PPT Agent application.

## Tech Stack

- **Framework**: Vite + React 19 + TypeScript
- **Routing**: React Router v7
- **State Management**: Zustand (auth) + React Query (server state)
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Pages

- `/login` - User login
- `/register` - User registration
- `/` - Home page (project list)
