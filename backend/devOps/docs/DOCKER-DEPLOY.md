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
| `.env` | Production environment variables, created locally from `backend/.env.example` and kept out of Git |

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
cp backend/.env.example backend/devOps/.env
# Edit backend/devOps/.env and replace all placeholder values
nano backend/devOps/.env
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
cd ~/liquidflow/backend/devOps
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
# Local nginx/TLS/proxy health check. Validate the production certificate
# separately against the real hostname.
curl -fkSs https://localhost/health

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

cd backend/devOps

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

The bundled `nginx/nginx.conf` redirects plaintext HTTP to HTTPS and proxies
HTTPS paths, including `/health`, to the backend:

```nginx
server {
  listen 80;

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;

  location / {
    set $upstream_backend http://backend:3001;
    proxy_pass $upstream_backend;
  }
}
```

Mount the certificate and key expected by the compose/nginx configuration
before starting this stack. The separate Terraform/ALB topology terminates TLS
at the ALB and does not supply an ACM certificate to this nginx container.

---

## Rollback

For a failed GitHub Actions deployment, first follow the incident checks and
database-safety guidance in the
[production rollback runbook](CI-CD.md#production-rollback-runbook). The manual
procedure below is only for deployments managed directly from this guide.

Choose the last release commit that has positive deployment and health-check
evidence. Do not assume that the previous commit on `main` is known-good. If a
failed release reached `prisma migrate deploy`, inspect the migration state and
confirm the selected application is compatible with the current schema before
starting it. Follow the digest-pinned operator-image gate in
[CI-CD.md](CI-CD.md#2-confirm-database-compatibility-before-rollback). The
production image omits the Prisma CLI, so do not depend on `exec` into a failed
container or allow `npx` to download a CLI during an incident. If no approved
operator-image digest exists, stop and roll forward instead of starting the
older application.

```bash
cd ~/liquidflow

COMPOSE=(
  -f backend/devOps/docker/docker-compose.yml
  -f backend/devOps/docker/docker-compose.prod.yml
  --env-file backend/devOps/.env
)

# Verify and check out the recorded last-good source revision.
git fetch origin main
git show --no-patch --oneline <known-good-commit>
git status --short
git checkout --detach <known-good-commit>

docker compose "${COMPOSE[@]}" up -d --build --remove-orphans
docker compose "${COMPOSE[@]}" ps
docker compose "${COMPOSE[@]}" logs --tail=200 backend nginx
docker compose "${COMPOSE[@]}" exec -T nginx nginx -t
docker compose "${COMPOSE[@]}" exec -T backend node -e \
  "require('http').get('http://127.0.0.1:3001/health', (res) => { if (res.statusCode !== 200) process.exitCode = 1; res.pipe(process.stdout); }).on('error', (error) => { console.error(error); process.exit(1); });"
curl -fkSs https://localhost/health
```

Prisma migrations are forward-only. Do not start the old application unless
the digest-pinned pre-start check and application/schema compatibility review
both pass; roll forward with compatible code or a reviewed compensating
migration instead. The loopback `curl -k` checks nginx and proxy behavior only;
verify the production hostname and certificate from a trusted external client
before declaring recovery.

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `postgres` container stays unhealthy | Check `POSTGRES_USER` / `POSTGRES_PASSWORD` in `.env` match what is already in the `postgres_data` volume. If re-initialising, run `docker compose down -v` to wipe the volume. |
| Backend exits with `P1001` (DB unreachable) | Ensure `DATABASE_URL` uses `postgres` as hostname (service name), not `localhost`. |
| Port 80 already in use | Stop any other web server (`sudo systemctl stop nginx`) before starting the stack. |
| `permission denied` on `.env` | Run `chmod 600 backend/devOps/.env`. |
