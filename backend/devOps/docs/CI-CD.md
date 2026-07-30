# CI / CD — GitHub Actions

LiquidFlow uses two independent GitHub Actions workflows: **CI** (continuous integration) and **CD** (continuous deployment). Both can be toggled on/off via repository variables, so you never need to edit YAML files to pause them.

---

## Workflows at a Glance

| Workflow | File | Trigger | Flag |
|----------|------|---------|------|
| CI | `backend/devOps/.github/workflows/aws/ci.yml` | Every push / PR to `main` or `develop` | `ENABLE_CI` |
| CD | `backend/devOps/.github/workflows/aws/cd.yml` | Push to `main` | `ENABLE_CD` |

> **Discovery prerequisite:** GitHub only runs workflow files directly under
> the repository-root `.github/workflows/` directory. The AWS files above are
> currently stored as nested deployment templates, so GitHub will not discover
> them in place. Review and install the intended workflow at the root before
> relying on its trigger or flags. The rollback procedure below documents the
> Docker/SSH commands in that template; it does not imply that the nested file
> is currently active.

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
2. Extracts metadata (tags: `<short-sha>` with no prefix, plus `latest`).
3. Builds the backend image from `backend/Dockerfile` using **Docker Buildx** with GitHub Actions cache.
4. Pushes both tags to `<DOCKER_HUB_USER>/liquidflow-backend`.

`docker/metadata-action` selects the higher-priority raw `latest` tag for its
`version` output, so the workflow's `image_tag` output currently resolves to
`latest`, not the short-SHA tag. Both tags are pushed, but the deploy job pulls
`latest`.

#### 3. `deploy` — Deploy to EC2 via SSH

Uses `appleboy/ssh-action` to SSH into the EC2 instance and:

```bash
# 1. Pull latest code
git pull origin main

# 2. Write production .env from the GitHub secret
echo "$APP_ENV_FILE" > .env

# 3. Pull the new Docker image
docker pull <user>/liquidflow-backend:latest

# 4. Restart services (no downtime — docker compose recreates changed containers)
docker compose -f backend/devOps/docker/docker-compose.yml \
               -f backend/devOps/docker/docker-compose.prod.yml \
               --env-file .env up -d --remove-orphans

# 5. Run Prisma migrations
docker compose -f backend/devOps/docker/docker-compose.yml \
               --env-file .env \
               exec -T backend npx prisma migrate deploy

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

## Production Rollback Runbook

Use this runbook when the `deploy` job has connected to EC2 and then fails.
If the `build` job fails before `deploy` starts, the running production stack
has not been changed and does not need to be rolled back. This procedure
restores an application image; it does not reverse a Prisma migration or a
Terraform change.

### 1. Pause and identify the failed stage

Have a repository operator set `ENABLE_CD=false` (or hold the production
environment approval) before changing the host. Record the failed workflow
run and triggering SHA. Separately record the image actually running on the
host and any independently maintained deployment record that ties an immutable
registry digest to a previously healthy production deployment.

The current SSH step runs `git pull origin main`, so the workflow's triggering
SHA is not proof of the source revision checked out on EC2. Treat the host SHA
as separate evidence and collect the current state before changing it. Run all
of the probes and retain non-zero output as incident evidence; a stopped
container should not prevent inspection of its configured image and image ID.

```bash
cd ~/liquidflow

git status --short
git rev-parse HEAD

COMPOSE=(
  -f backend/devOps/docker/docker-compose.yml
  -f backend/devOps/docker/docker-compose.prod.yml
  --env-file .env
)

docker compose "${COMPOSE[@]}" ps --all
docker compose "${COMPOSE[@]}" logs --tail=200 backend nginx
docker compose "${COMPOSE[@]}" exec -T nginx nginx -t
docker compose "${COMPOSE[@]}" exec -T backend node -e \
  "require('http').get('http://127.0.0.1:3001/health', (res) => { if (res.statusCode !== 200) process.exitCode = 1; res.pipe(process.stdout); }).on('error', (error) => { console.error(error); process.exit(1); });"
curl -fkSs https://localhost/health
BACKEND_CONTAINER="$(docker compose "${COMPOSE[@]}" ps --all --quiet backend)"
if [ -n "$BACKEND_CONTAINER" ]; then
  docker inspect --format 'configured={{.Config.Image}} image_id={{.Image}}' \
    "$BACKEND_CONTAINER"
  docker image inspect --format 'id={{.Id}} repo_digests={{json .RepoDigests}}' \
    "$(docker inspect --format '{{.Image}}' "$BACKEND_CONTAINER")"
else
  echo "No backend container exists; use deployment inventory evidence" >&2
fi
df -h
```

Do not print or attach `.env`. Redact credentials or connection strings from
logs before sharing them in an incident or issue. The `curl -k` probe is only a
loopback check of nginx and its backend proxy; validate the real certificate
separately against the production hostname.

Use the failed step and the checks above to classify the state:

- A failure before `docker compose up` usually leaves the previous containers
  running; confirm with `ps` and the health endpoint before taking action.
- An unhealthy `backend` or `nginx` container after `docker compose up`
  indicates a partially deployed application stack.
- If `prisma migrate deploy` failed, preserve its logs and treat the database
  schema as potentially changed. Prisma migrations are forward-only; do not
  try to reverse one in place.

Check the related infrastructure before blaming the application deployment:

- **EC2:** confirm the instance status checks are healthy, the Docker daemon is
  running, and disk space is available.
- **RDS/database:** check RDS availability/events and the Prisma migration log.
  The `/health` route does not test the database, so do not use it as database
  evidence.
- **nginx:** require `nginx -t` plus both the direct backend probe and the local
  HTTPS `/health` proxy probe above.

### 2. Confirm database compatibility before rollback

If the failed run reached `prisma migrate deploy`, stop before starting an
older application image. Preserve the migration output. The production backend
image installs production dependencies only and does not contain the Prisma
CLI; do not run `npx prisma` in a failed container because it can fail when the
container is stopped or download an unpinned CLI during the incident.

Inspect migration state only with an operator image that was built from the
matching repository revision, contains the lockfile-pinned Prisma CLI and
schema, and has an independently approved registry digest. The repository does
not currently publish that operator artifact. If your deployment records do
not provide one, stop here and use a reviewed roll-forward or compensating
migration instead of starting older application code.

```bash
cd ~/liquidflow

MIGRATION_CHECK_IMAGE="<approved-registry>/liquidflow-prisma-operator@sha256:<approved-64-hex-digest>"
printf '%s\n' "$MIGRATION_CHECK_IMAGE" | grep -Eq '@sha256:[0-9a-f]{64}$' || {
  echo "Refusing an incident-time migration check without an approved digest" >&2
  exit 1
}
docker pull "$MIGRATION_CHECK_IMAGE"
docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' \
  "$MIGRATION_CHECK_IMAGE" | grep -Fx -- "$MIGRATION_CHECK_IMAGE" || {
  echo "Migration operator image does not resolve to the approved digest" >&2
  exit 1
}

umask 077
cat > /tmp/liquidflow-migration-check.override.yml <<EOF
services:
  backend:
    image: ${MIGRATION_CHECK_IMAGE}
EOF

CHECK_COMPOSE=(
  -f backend/devOps/docker/docker-compose.yml
  -f backend/devOps/docker/docker-compose.prod.yml
  -f /tmp/liquidflow-migration-check.override.yml
  --env-file .env
)

docker compose "${CHECK_COMPOSE[@]}" run --rm --no-deps --pull never backend \
  prisma migrate status --schema /app/prisma/schema.prisma
```

Confirm that the known-good application is compatible with every migration
already applied. Prisma migrations are forward-only: do not run a down
migration. If compatibility is unknown or the old application cannot use the
current schema, do not start it; roll forward with compatible application code
or a reviewed compensating migration. Remove
`/tmp/liquidflow-migration-check.override.yml` after the read-only check.

### 3. Redeploy an independently validated artifact

The current CD template pushes short-SHA and `latest` tags, but its deploy job
does not configure Compose to run the pulled registry image. A successful
workflow therefore does not prove that either tag ran in production. Treat a
workflow tag only as a candidate for investigation, not as a known-good
artifact.

Continue only with a digest reference from an independent deployment record
that ties the exact image to a previously healthy production deployment. Do
not use `latest`, a mutable short-SHA tag, a guessed previous commit, or the EC2
checkout. If no deployment-validated digest is available, stop and use a
reviewed roll-forward or manual recovery plan instead of performing this image
rollback.

```bash
cd ~/liquidflow

KNOWN_GOOD_IMAGE="<docker-user>/liquidflow-backend@sha256:<deployment-validated-64-hex-digest>"
printf '%s\n' "$KNOWN_GOOD_IMAGE" | grep -Eq '@sha256:[0-9a-f]{64}$' || {
  echo "Refusing rollback without an immutable digest reference" >&2
  exit 1
}
docker pull "$KNOWN_GOOD_IMAGE"
docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' \
  "$KNOWN_GOOD_IMAGE" | grep -Fx -- "$KNOWN_GOOD_IMAGE" || {
  echo "Pulled image does not resolve to the approved digest" >&2
  exit 1
}
```

The base compose file declares `build:` and does not select the image pulled by
the CD workflow. Use a temporary override to pin the backend to the verified
digest without changing repository files:

```bash
umask 077
cat > /tmp/liquidflow-rollback.override.yml <<EOF
services:
  backend:
    image: ${KNOWN_GOOD_IMAGE}
EOF

COMPOSE=(
  -f backend/devOps/docker/docker-compose.yml
  -f backend/devOps/docker/docker-compose.prod.yml
  -f /tmp/liquidflow-rollback.override.yml
  --env-file .env
)

docker compose "${COMPOSE[@]}" config --images
docker compose "${COMPOSE[@]}" up -d --no-build --remove-orphans
```

Before continuing, confirm that `config --images` lists the exact
`KNOWN_GOOD_IMAGE` digest reference; otherwise stop rather than deploying an
unverified local build or mutable tag.

### 4. Verify and resume deployments

```bash
cd ~/liquidflow

COMPOSE=(
  -f backend/devOps/docker/docker-compose.yml
  -f backend/devOps/docker/docker-compose.prod.yml
  -f /tmp/liquidflow-rollback.override.yml
  --env-file .env
)

docker compose "${COMPOSE[@]}" ps
docker compose "${COMPOSE[@]}" logs --tail=200 backend nginx
docker compose "${COMPOSE[@]}" exec -T nginx nginx -t
docker compose "${COMPOSE[@]}" exec -T backend node -e \
  "require('http').get('http://127.0.0.1:3001/health', (res) => { if (res.statusCode !== 200) process.exitCode = 1; res.pipe(process.stdout); }).on('error', (error) => { console.error(error); process.exit(1); });"
curl -fkSs https://localhost/health
```

From a trusted client outside the host, also run
`curl -fsS https://<production-host>/health` so certificate and ingress failures
are visible. Confirm the backend, RDS dependency, nginx, and external endpoint
remain healthy before closing the incident. Record the restored digest,
container image ID, and validation results. If migration state must be checked
again, repeat the digest-pinned one-off operator command from step 2; do not
install or download a CLI inside the restored application container.

Keep `ENABLE_CD=false` and retain the rollback override until the permanent fix
is merged and the CD/compose path is updated to consume the workflow's tagged
image. The current workflow pulls an image but its base compose service still
uses `build:`, so simply re-running it is not a reliable release or rollback.
Remove `/tmp/liquidflow-rollback.override.yml` only as part of that reviewed
return-to-normal deployment.

For a manual Docker deployment, see the cross-reference in
[DOCKER-DEPLOY.md](DOCKER-DEPLOY.md#rollback). For infrastructure provisioning
context, see [TERRAFORM-DEPLOY.md](TERRAFORM-DEPLOY.md#cicd-integration-github-actions-example).

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| CD skipped without error | Check `ENABLE_CD` variable is exactly `true` |
| SSH connection refused | Verify `EC2_HOST`, `EC2_USER` and `EC2_SSH_KEY` are correct |
| `prisma migrate deploy` fails | Ensure `DATABASE_URL` in `APP_ENV_FILE` points to the RDS instance |
| Docker Hub push 401 | Regenerate `DOCKER_HUB_TOKEN` — it may have expired |
