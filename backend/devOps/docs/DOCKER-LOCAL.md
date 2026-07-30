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
| `../.env.local` | Environment variables for local development (create locally; not committed) |

### How the development override is loaded

Docker Compose merges `docker-compose.override.yml` after
`docker-compose.yml`, so values in the override augment or replace the base
service configuration. In this repository the override:

- publishes PostgreSQL on host port `5432`;
- builds the backend's `builder` stage so development dependencies are present;
- sets `NODE_ENV=development` and `PORT=3001`;
- publishes the backend on host port `3001`;
- bind-mounts `backend/src` at `/app/src`; and
- starts `npm run dev` for hot reload.

With no `-f` option, Compose searches the current directory and its parents for
a base Compose file, then loads a same-directory
`docker-compose.override.yml`. The recommended automatic-discovery invocation
for this repository is therefore:

```bash
cd backend/devOps/docker
docker compose --env-file ../../.env.local up --build
```

When running from the repository root—or whenever any `-f` option is used—list
both files explicitly in base-then-override order. Compose does not append the
default override automatically to an explicit `-f` file list:

```bash
docker compose \
  -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local \
  up --build
```

The override inherits database configuration from the base file. Create
`backend/.env.local` from `backend/.env.example`, then set consistent
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `DATABASE_URL` values.
Inside Compose, `DATABASE_URL` must use `postgres` as the hostname. Do not put
real production or AWS credentials in this local file.

---

## First-time Setup

### 1. Create the local environment file

```bash
# From the repository root
cp backend/.env.example backend/.env.local
# Replace the placeholder database values in backend/.env.local.
```

The file is ignored by Git. Keep the four database values described above in
sync so the backend can authenticate to the Compose `postgres` service.

### 2. Start the stack

```bash
docker compose \
  -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local \
  up --build
```

Docker Compose will:
1. Start `postgres:16-alpine` and wait for its healthcheck to pass.
2. Build the backend image using the `builder` stage (includes `devDependencies`).
3. Start the backend with `npm run dev` (hot-reload via `nodemon`).

### 3. Run Prisma migrations

Summary of what was run and observed when applying Prisma migrations inside the backend container.

Commands executed (inside running backend container):

```bash
# attempt to apply a migration
docker exec -it <container> npx prisma migrate dev --name init_postgres

# reset the development database (drops all data)
docker exec -it <container> npx prisma migrate reset

# re-create and apply migration from current schema
docker exec -it <container> npx prisma migrate dev --name init_postgres
```

If the migration process fails or the database/migration state is inconsistent, you can follow these recovery steps:

1. Delete the `prisma/migrations` folder inside the backend container (replace the container id if different):

```bash
docker exec -it <container> rm -rf prisma/migrations
docker exec -it <container> prisma migrate reset
```

2. Delete the local `prisma/migrations` folder on your machine (PowerShell):

```powershell
Remove-Item -Recurse -Force .\prisma\migrations
```

3. Retry creating and applying the migration from the container:

```bash
docker exec -it <container> npx prisma migrate dev --name init_postgres
```

Note: these steps remove migration history and should only be used for local development. For shared or production databases, prefer inspecting drift with `prisma migrate status` and restoring from backups instead of deleting migrations.

Observed outputs and actions:

- Prisma reported a schema drift: the database schema had tables and indexes that did not match the local migration history.
- Detected additions: tables `Stream` and `StreamEvent`.
- Detected schema changes on `Stream` and `User` (indexes, unique constraints, and foreign keys).
- Noted a migration present in the database but missing locally: `20260224062743_first_migration`.
- Performed `prisma migrate reset` to clear the development database (all data lost) and remove drift.
- After reset, running `prisma migrate dev --name init_postgres` created and applied a new migration:

	- `prisma/migrations/20260224063217_init_postgres/migration.sql`

- Final state: "Your database is now in sync with your schema."

Notes / recommendations:

- The missing migration `20260224062743_first_migration` indicates a migration was applied to the database earlier but its folder is not present in the local `prisma/migrations` directory. To avoid this, keep migration folders checked into source control.
- Use `prisma migrate status` to inspect migration vs DB state before running destructive commands.
- For CI / production apply-only flows, prefer `npx prisma migrate deploy` (non-interactive) instead of `migrate dev`.

Reproducible commands (from repo root):

```bash
# Recommended when creating migration files that must be reviewed and committed:
cd backend
# export DATABASE_URL='postgresql://user:password@localhost:5432/liquidflow_dev?schema=public'
npx prisma migrate dev --name <migration-name> --schema ./prisma/schema.prisma

# Return to the repository root before using the Compose command below.
cd ..

# Database-only Compose check. Generated files remain inside the container.
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local \
  exec backend npx prisma migrate dev --name <migration-name>
```

Notes:
- `migrate dev` creates migration files under `prisma/migrations`, applies them to the database, and updates the Prisma client for development.
- The development override bind-mounts only `backend/src` at `/app/src`; it
  does not bind-mount `/app/prisma`. A migration generated by the Compose
  `exec` command is container-local and can disappear when that container is
  recreated. Use the host-side command above for migration files that belong
  in source control, or add a separately reviewed Prisma bind-mount workflow.
- Use `migrate deploy` in CI/production to apply already-created migrations without prompts.
- When running via Docker Compose, ensure the `backend` service can reach the Postgres container (the compose setup already waits for Postgres healthcheck).

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
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local up -d

# View backend logs
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local logs -f backend

# Stop everything (keep volumes)
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local down

# Stop and wipe the database
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local down -v

# Rebuild after code changes
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local up --build

# Open a shell inside the backend container
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local \
  exec backend sh

# Run Prisma Studio (DB GUI)
docker compose -f backend/devOps/docker/docker-compose.yml \
  -f backend/devOps/docker/docker-compose.override.yml \
  --env-file backend/.env.local \
  exec backend npx prisma studio
```

---

## Hot Reload

The override file mounts `backend/src` into the container:

```yaml
volumes:
  - ../../src:/app/src
```

Any change you save to a `.ts` file inside `backend/src/` is picked up automatically — no need to rebuild the image.

---

## Connecting to the Database

Use any PostgreSQL client with these credentials:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| User | `POSTGRES_USER` from `backend/.env.local` |
| Password | `POSTGRES_PASSWORD` from `backend/.env.local` |
| Database | `POSTGRES_DB` from `backend/.env.local` |

---

## Environment Variables

The file path and tracked template for this stack are the
`backend/.env.local` / `backend/.env.example` pair documented above. For
variable meanings, see the PostgreSQL and backend sections of
[DOCKER-ENV.md](DOCKER-ENV.md#postgresql). Its opening file-location table
describes a legacy `devOps/` layout and does not override the paths in this
guide.
