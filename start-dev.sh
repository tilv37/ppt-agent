#!/bin/bash

echo "🚀 Starting PPT Agent (Frontend + Backend)"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.22+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Start backend
echo "📦 Starting Go backend..."
cd backend-go

if [ ! -f ".env" ]; then
    echo "⚠️  .env not found, copying from .env.example"
    cp .env.example .env
    echo "⚠️  Please edit backend-go/.env and set JWT_SECRET before production use"
fi

# Create data directory
mkdir -p data

# Create data directory if not exists
mkdir -p data

# Start backend in background
go run cmd/server/main.go &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) at http://localhost:8080"

cd ..

# Start frontend
echo ""
echo "🎨 Starting React frontend..."
cd frontend-react

if [ ! -f ".env" ]; then
    echo "⚠️  .env not found, copying from .env.example"
    cp .env.example .env
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID) at http://localhost:5173"

cd ..

echo ""
echo "✨ Both services are running!"
echo ""
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
