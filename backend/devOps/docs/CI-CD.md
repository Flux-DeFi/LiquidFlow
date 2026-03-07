# CI / CD — GitHub Actions

LiquidFlow uses two independent GitHub Actions workflows: **CI** (continuous integration) and **CD** (continuous deployment). Both can be toggled on/off via repository variables, so you never need to edit YAML files to pause them.

---

## Workflows at a Glance

| Workflow | File | Trigger | Flag |
|----------|------|---------|------|
| CI | `.github/workflows/ci.yml` | Every push / PR to `main` or `develop` | `ENABLE_CI` |
| CD | `.github/workflows/cd.yml` | Push to `main` | `ENABLE_CD` |

---

## Enabling / Disabling

Go to **Settings → Secrets and variables → Variables** and create:

| Variable | Value |
|----------|-------|
| `ENABLE_CI` | `true` \| `false` |
| `ENABLE_CD` | `true` \| `false` |

Setting either flag to `false` lets the `check-flag` job succeed while skipping all subsequent jobs — no yellow ❌, just a clean skip.

---

## CI — `ci.yml`

### When it runs
- Every push to any branch.
- Every pull request targeting `main` or `develop`.
- Previous runs on the same branch are cancelled automatically (`cancel-in-progress: true`).

### Jobs

#### `backend` — Test & Build

1. Spins up a `postgres:16-alpine` service container.
2. Installs Node 20 dependencies (`npm ci`).
3. Generates the Prisma client (`npx prisma generate`).
4. Runs migrations against the test DB (`npx prisma migrate deploy`).
5. Runs the test suite (`npm test`).
6. Verifies the TypeScript build compiles (`npm run build`).

```yaml
env:
  DATABASE_URL: postgresql://test:test@localhost:5432/liquidflow_test
```

#### `frontend` — Lint & Build

1. Installs Node 20 dependencies (`npm ci`).
2. Runs ESLint (`npm run lint`).
3. Runs the Next.js production build (`npm run build`).

### Secrets / Variables required for CI

| Name | Type | Description |
|------|------|-------------|
| `ENABLE_CI` | Variable | `true` to run the workflow |

> The CI workflow uses no AWS or Docker secrets — all infrastructure is ephemeral GitHub-hosted runners.

---

## CD — `cd.yml`

### When it runs
- Push to `main` only.
- Never cancels a deployment in progress (`cancel-in-progress: false`).

### Jobs

#### 1. `check-flag`
Reads the `ENABLE_CD` repository variable and exposes it as an output used by all other jobs.

#### 2. `build` — Build & Push Docker Image

1. Logs in to Docker Hub.
2. Extracts metadata (tags: `sha-<short>` + `latest`).
3. Builds the backend image from `backend/Dockerfile` using **Docker Buildx** with GitHub Actions cache.
4. Pushes both tags to `<DOCKER_HUB_USER>/liquidflow-backend`.

The short SHA tag is passed as an output (`image_tag`) to the deploy job.

#### 3. `deploy` — Deploy to EC2 via SSH

Uses `appleboy/ssh-action` to SSH into the EC2 instance and:

```bash
# 1. Pull latest code
git pull origin main

# 2. Write production .env from the GitHub secret
echo "$APP_ENV_FILE" > .env

# 3. Pull the new Docker image
docker pull <user>/liquidflow-backend:<sha>

# 4. Restart services (no downtime — docker compose recreates changed containers)
docker compose -f devOps/docker/docker-compose.yml \
               -f devOps/docker/docker-compose.prod.yml \
               --env-file .env up -d --remove-orphans

# 5. Run Prisma migrations
docker compose exec -T backend npx prisma migrate deploy

# 6. Prune old images
docker image prune -f
```

The job is tied to the **`production` environment**, so GitHub can enforce required reviewers or wait timers if configured.

### Secrets required for CD

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | Public IP or hostname of the target EC2 instance |
| `EC2_USER` | SSH user (`ec2-user`, `ubuntu`, etc.) |
| `EC2_SSH_KEY` | PEM private key for the EC2 key pair |
| `DOCKER_HUB_USER` | Docker Hub username |
| `DOCKER_HUB_TOKEN` | Docker Hub access token (not password) |
| `APP_ENV_FILE` | Full contents of the production `.env` file |

> **Tip:** generate `APP_ENV_FILE` by copying `.env.prod`, filling in real values and pasting the whole content as a multi-line secret.

---

## Deployment Flow Diagram

```
 git push main
       │
       ▼
 ┌─────────────┐     flag=false    ┌──────────┐
 │ check-flag  │ ────────────────▶ │  (skip)  │
 └──────┬──────┘                   └──────────┘
        │ flag=true
        ▼
 ┌─────────────────────────────────────────┐
 │  build                                  │
 │  docker buildx → Docker Hub (sha+latest)│
 └────────────────────┬────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────┐
 │  deploy (SSH → EC2)                     │
 │  git pull → write .env → docker compose │
 │  → prisma migrate → image prune         │
 └─────────────────────────────────────────┘
```

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| CD skipped without error | Check `ENABLE_CD` variable is exactly `true` |
| SSH connection refused | Verify `EC2_HOST`, `EC2_USER` and `EC2_SSH_KEY` are correct |
| `prisma migrate deploy` fails | Ensure `DATABASE_URL` in `APP_ENV_FILE` points to the RDS instance |
| Docker Hub push 401 | Regenerate `DOCKER_HUB_TOKEN` — it may have expired |
