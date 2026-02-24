# Production Deployment — Docker Compose

This guide covers deploying LiquidFlow to a Linux server (EC2 or any VPS) using Docker Compose.

> For fully automated deployments via GitHub Actions, see [CI-CD.md](CI-CD.md).  
> For provisioning the AWS infrastructure first, see [TERRAFORM-DEPLOY.md](TERRAFORM-DEPLOY.md).

---

## Files Used

| File | Role |
|------|------|
| `docker/docker-compose.yml` | Base: postgres, backend, nginx services |
| `docker/docker-compose.prod.yml` | Prod overrides: restart policy, logging, memory limits |
| `.env.prod` | Production environment variables |

---

## Prerequisites on the Server

- Docker Engine >= 24
- Docker Compose >= 2.x
- Git
- The server's security group / firewall opens ports `80` (HTTP) and `443` (HTTPS)

---

## First-time Deployment

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/liquidflow.git ~/liquidflow
cd ~/liquidflow
```

### 2. Create the production `.env`

```bash
cp devOps/.env.prod devOps/.env
# Edit devOps/.env and replace all placeholder values
nano devOps/.env
```

Minimum values to update:

```dotenv
POSTGRES_USER=liquidflow_prod
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=liquidflow_prod
DATABASE_URL=postgresql://liquidflow_prod:<password>@postgres:5432/liquidflow_prod
```

### 3. Build and start services

```bash
cd ~/liquidflow/devOps
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  --env-file .env \
  up -d --build
```

### 4. Run database migrations

```bash
docker compose \
  -f docker/docker-compose.yml \
  --env-file .env \
  exec -T backend npx prisma migrate deploy
```

### 5. Verify the deployment

```bash
# Health check
curl http://localhost/api/health

# Container status
docker compose -f docker/docker-compose.yml --env-file .env ps

# Backend logs
docker compose -f docker/docker-compose.yml --env-file .env logs -f backend
```

---

## Service Overview

```
Internet
    │  :80 / :443
    ▼
┌──────────────────────────────┐
│   nginx (nginx:alpine)       │  Reverse proxy
│   /api  → backend:3001       │
└──────────────┬───────────────┘
               │  flowfi-network
    ┌──────────▼──────────┐
    │  backend (Node.js)  │  Express + Prisma
    │  PORT 3001          │  mem limit: 512 MB
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  postgres:16-alpine │  Data volume: postgres_data
    └─────────────────────┘
```

### Production-specific settings (`docker-compose.prod.yml`)

| Setting | Value | Description |
|---------|-------|-------------|
| `restart` | `unless-stopped` | Auto-restart on crash or server reboot |
| `NODE_ENV` | `production` | Disables dev tooling, reduces Prisma logs |
| `memory` limit | `512M` | Hard memory cap for the backend container |
| `cpus` limit | `0.5` | CPU share limit |
| Log driver | `json-file` | Structured logs, max 10 MB × 3 files |

---

## Updating to a New Version

```bash
cd ~/liquidflow

# Pull latest code
git pull origin main

cd devOps

# Rebuild and restart only changed services
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  --env-file .env \
  up -d --build --remove-orphans

# Apply any new migrations
docker compose \
  -f docker/docker-compose.yml \
  --env-file .env \
  exec -T backend npx prisma migrate deploy

# Remove dangling images
docker image prune -f
```

---

## Nginx Configuration

The bundled `nginx/nginx.conf` proxies all `/api` requests to the backend:

```nginx
upstream backend {
  server backend:3001;
}

server {
  listen 80;

  location /api {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

To enable **HTTPS**, mount a `nginx.conf` with an SSL server block and point `certificate_arn` at your ACM certificate (handled automatically by Terraform in the `prod` environment).

---

## Rollback

```bash
cd ~/liquidflow

# Find the previous commit
git log --oneline -5

# Roll back code
git checkout <previous-sha>

cd devOps
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  --env-file .env \
  up -d --build
```

> Prisma migrations are forward-only. If a migration needs to be rolled back, create a new migration that reverses the schema change.

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `postgres` container stays unhealthy | Check `POSTGRES_USER` / `POSTGRES_PASSWORD` in `.env` match what is already in the `postgres_data` volume. If re-initialising, run `docker compose down -v` to wipe the volume. |
| Backend exits with `P1001` (DB unreachable) | Ensure `DATABASE_URL` uses `postgres` as hostname (service name), not `localhost`. |
| Port 80 already in use | Stop any other web server (`sudo systemctl stop nginx`) before starting the stack. |
| `permission denied` on `.env` | Run `chmod 600 devOps/.env`. |
