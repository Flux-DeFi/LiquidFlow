

# DevOps Documentation — LiquidFlow

This folder contains all operational documentation for the LiquidFlow project.

---

## Documents

| File | Description |
|------|-------------|
| [DOCKER-LOCAL.md](DOCKER-LOCAL.md) | Run the full stack locally with Docker Compose |
| [DOCKER-ENV.md](DOCKER-ENV.md) | All environment variables explained |
| [DOCKER-DEPLOY.md](DOCKER-DEPLOY.md) | Production deployment with Docker Compose |
| [CI-CD.md](CI-CD.md) | GitHub Actions CI and CD pipelines |
| [TERRAFORM-DEPLOY.md](TERRAFORM-DEPLOY.md) | AWS infrastructure provisioning with Terraform |

---

## Folder Structure

```
devOps/
├── .env.example          ← Template — copy and fill in values
├── .env.local            ← Local Docker development (safe to commit)
├── .env.prod             ← Production overrides (DO NOT commit)
├── docker/
│   ├── docker-compose.yml          ← Base services (postgres, backend, nginx)
│   ├── docker-compose.override.yml ← Dev overrides (hot-reload, exposed ports)
│   └── docker-compose.prod.yml     ← Prod overrides (restart, logging, limits)
├── nginx/
│   └── nginx.conf        ← Reverse proxy: /api → backend:3001
├── terraform/            ← AWS infrastructure (see TERRAFORM-DEPLOY.md)
├── docs/                 ← You are here
└── .github/workflows/
    ├── ci.yml            ← Tests + build on every push
    └── cd.yml            ← Deploy to EC2 on push to main
```

---

## Quick Reference

### Local development
```bash
# From repo root
cd devOps
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml \
  --env-file .env.local up --build
```

### Production
```bash
cd devOps
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml \
  --env-file .env.prod up -d --build
```

### Run Prisma migrations manually
```bash
docker compose -f docker/docker-compose.yml --env-file .env.local \
  exec backend npx prisma migrate deploy
```

### Terraform (provision AWS infra)
```bash
cd devOps/terraform/scripts
chmod +x bootstrap.sh deploy.sh
./bootstrap.sh                       # run once
./deploy.sh dev plan
./deploy.sh dev apply
```
 