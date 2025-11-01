# Starting S3ntraCS

## Prerequisites Check

Before starting, ensure:
1. ✅ Docker Desktop is installed and running
2. ✅ Ports 3000 (frontend), 8000 (backend), and 5432 (database) are available

## Quick Start Commands

### Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your Mac.

### Step 2: Start All Services
```bash
docker compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- FastAPI backend (port 8000)
- React frontend (port 3000)

### Step 3: Run Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### Step 4: Create First Admin User
```bash
docker compose exec backend python -m app.utils.create_admin
```

Or register via the web interface at http://localhost:3000/register

### Step 5: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

## Alternative: Use the Setup Script

```bash
./setup.sh
docker compose up -d
```

## Check Service Status

```bash
docker compose ps
```

## View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## Stop Services

```bash
docker compose down
```

## Restart Services

```bash
docker compose restart
```

## Troubleshooting

### Docker daemon not running
Start Docker Desktop application

### Port already in use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database connection errors
```bash
# Restart database
docker compose restart db

# Check database logs
docker compose logs db
```

### Backend won't start
```bash
# Check backend logs
docker compose logs backend

# Rebuild backend
docker compose build backend
docker compose up -d backend
```

### Frontend won't start
```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

### Migration errors
```bash
# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d db
sleep 5
docker compose exec backend alembic upgrade head
```

