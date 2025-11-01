#!/bin/bash

# S3ntraCS Startup Script
# This script starts the entire application

set -e

echo "🚀 Starting S3ntraCS..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://s3ntracs:s3ntracs@db:5432/s3ntracs

# JWT Authentication
JWT_SECRET=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS
AWS_REGION=us-east-1

# Application
LOG_LEVEL=INFO
EOF
    echo "✅ .env file created"
fi

# Build and start services
echo "🐳 Starting Docker services..."
docker compose up -d --build

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 8

# Run migrations
echo "📊 Running database migrations..."
docker compose exec -T backend alembic upgrade head 2>/dev/null || {
    echo "⚠️  Migrations may have failed. This is OK if tables already exist."
}

echo ""
echo "✅ S3ntraCS is starting!"
echo ""
echo "📍 Services:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Next steps:"
echo "   1. Wait 10-15 seconds for services to fully start"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Register your first account (becomes superadmin)"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker compose logs -f"
echo "   - Stop: docker compose down"
echo "   - Restart: docker compose restart"
echo ""

