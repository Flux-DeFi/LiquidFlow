# Local Development — Docker Compose

This guide explains how to run the full LiquidFlow stack (PostgreSQL + Backend) on your machine using Docker Compose.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker Desktop | >= 24 |
| Docker Compose | >= 2.x (bundled with Docker Desktop) |

---

## Files used

| File | Role |
|------|------|
| `docker/docker-compose.yml` | Base: postgres + backend + nginx services |
| `docker/docker-compose.override.yml` | Dev overrides: hot-reload, exposed DB port, dev build stage |
| `.env.local` | Environment variables for local development |

---

## First-time Setup

### 1. Cd to devOps directory

```bash
# From repo root
cd /backend
```

The default values in `.env.local` work out of the box — no changes needed for local development.

### 2. Start the stack

```bash
Set-Location D:\Archivos\grantfox\LiquidFlow\backend\devOps
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file ../.env.local up --build
```

Docker Compose will:
1. Start `postgres:16-alpine` and wait for its healthcheck to pass.
2. Build the backend image using the `builder` stage (includes `devDependencies`).
3. Start the backend with `npm run dev` (hot-reload via `nodemon`).

### 3. Run Prisma migrations

On the first run (or after adding new migrations) apply them:

```bash
docker compose -f docker/docker-compose.yml \
               --env-file .env.local \
               exec backend npx prisma migrate dev
```

---

## Exposed Ports

| Service | Host Port | Container Port | Notes |
|---------|-----------|----------------|-------|
| Backend | `3001` | `3001` | REST API + Swagger |
| PostgreSQL | `5432` | `5432` | Connect with TablePlus, DBeaver, etc. |

---

## Useful Endpoints

| URL | Description |
|-----|-------------|
| `http://localhost:3001/` | Health check (plain text) |
| `http://localhost:3001/health` | Detailed health JSON |
| `http://localhost:3001/api-docs` | Swagger UI |
| `http://localhost:3001/api-docs.json` | Raw OpenAPI spec |
| `http://localhost:3001/streams` | Streams API |

---

## Common Commands

```bash
# Start in detached mode
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml \
  --env-file .env.local up -d

# View backend logs
docker compose -f docker/docker-compose.yml --env-file .env.local logs -f backend

# Stop everything (keep volumes)
docker compose -f docker/docker-compose.yml --env-file .env.local down

# Stop and wipe the database
docker compose -f docker/docker-compose.yml --env-file .env.local down -v

# Rebuild after code changes
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml \
  --env-file .env.local up --build

# Open a shell inside the backend container
docker compose -f docker/docker-compose.yml --env-file .env.local \
  exec backend sh

# Run Prisma Studio (DB GUI)
docker compose -f docker/docker-compose.yml --env-file .env.local \
  exec backend npx prisma studio
```

---

## Hot Reload

The override file mounts `./backend/src` into the container:

```yaml
volumes:
  - ./backend/src:/app/src
```

Any change you save to a `.ts` file inside `backend/src/` is picked up automatically — no need to rebuild the image.

---

## Connecting to the Database

Use any PostgreSQL client with these credentials:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| User | `postgres` |
| Password | `postgres` |
| Database | `liquidflow_dev` |

---

## Environment Variables

See [DOCKER-ENV.md](DOCKER-ENV.md) for a full reference of all variables.
