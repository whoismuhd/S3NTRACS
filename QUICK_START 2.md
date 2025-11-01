# Quick Start - Running S3ntraCS

## Step 1: Start Docker Desktop

**On macOS:**
1. Open Docker Desktop application
2. Wait until Docker shows "Running" status in the menu bar

**Verify Docker is running:**
```bash
docker info
```

If this command works (no errors), Docker is ready!

---

## Step 2: Start the Application

### Option A: Use the startup script (Easiest)
```bash
./run.sh
```

### Option B: Manual start
```bash
# Start all services
docker compose up -d --build

# Wait for database (about 10 seconds)
sleep 10

# Run migrations
docker compose exec backend alembic upgrade head
```

---

## Step 3: Access the Application

Wait 10-15 seconds for all services to start, then open:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Docs**: http://localhost:8000/docs

---

## Step 4: Create Your First Account

1. Go to http://localhost:3000/register
2. Enter your email and password
3. **First user automatically becomes superadmin!**
4. You'll be redirected to login
5. Login and start using S3ntraCS

---

## Check Service Status

```bash
# See running containers
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

---

## Troubleshooting

### "Cannot connect to Docker daemon"
**Solution**: Start Docker Desktop application

### Port already in use
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # Database

# Kill the process or stop the conflicting service
```

### Services won't start
```bash
# Rebuild everything
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database migration errors
```bash
# Reset database (⚠️ destroys data)
docker compose down -v
docker compose up -d db
sleep 10
docker compose exec backend alembic upgrade head
```

### Backend shows errors
```bash
# Check logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

---

## Stop the Application

```bash
docker compose down
```

To also remove volumes (deletes database):
```bash
docker compose down -v
```

---

## Restart Services

```bash
docker compose restart
```

Or restart specific service:
```bash
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

---

## First Steps After Starting

1. ✅ Register at http://localhost:3000/register
2. ✅ Login
3. ✅ Create your first tenant (click "+ New Tenant")
4. ✅ Configure AWS role ARN and external ID
5. ✅ Run your first scan!
6. ✅ View findings and reports

Enjoy using S3ntraCS! 🚀

