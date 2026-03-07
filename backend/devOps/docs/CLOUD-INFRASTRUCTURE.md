# LiquidFlow — Cloud Infrastructure

> **Provider:** AWS | **IaC:** Terraform ≥ 1.7.0 | **Region:** `us-east-1`  
> All resources are tagged `ManagedBy = "Terraform"` and follow least-privilege IAM.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Network Topology](#2-network-topology)
3. [Component Breakdown](#3-component-breakdown)
4. [Security Model](#4-security-model)
5. [State Management](#5-state-management)
6. [Environment Matrix](#6-environment-matrix)
7. [Terraform Layout](#7-terraform-layout)
8. [Terraform Audit — Findings & Fixes](#8-terraform-audit--findings--fixes)
9. [Runbooks](#9-runbooks)

---

## 1. Architecture Overview

```
                          ┌─────────────────────────────────────────────────────┐
                          │                      AWS VPC                        │
  Internet                │                                                     │
  ─────────               │  ┌──────── Public Subnets ──────────────────────┐  │
      │                   │  │  us-east-1a           us-east-1b             │  │
      ▼                   │  │  ┌──────────────┐    ┌──────────────┐        │  │
  ┌───────┐               │  │  │  NAT GW #1   │    │  NAT GW #2   │        │  │
  │  ACM  │ (HTTPS cert)  │  │  └──────┬───────┘    └──────┬───────┘        │  │
  └───┬───┘               │  │         │                   │                 │  │
      │                   │  │  ┌──────┴───────────────────┴──────┐          │  │
      ▼                   │  │  │    Application Load Balancer     │          │  │
  ┌───────┐  :80/:443      │  │  │    (internet-facing, ALB SG)    │◄─────────┼──┤
  │  ALB  │───────────────►│  │  └─────────────────────────────────┘          │  │
  └───────┘               │  └─────────────────────────────────────────────┘  │
                          │                                                     │
                          │  ┌──────── Private Subnets ─────────────────────┐  │
                          │  │  us-east-1a           us-east-1b             │  │
                          │  │  ┌──────────────┐    ┌──────────────┐        │  │
                          │  │  │  EC2 :3001   │    │  EC2 :3001   │        │  │
                          │  │  │  (ASG, EC2SG)│    │  (ASG, EC2SG)│        │  │
                          │  │  └──────┬───────┘    └──────┬───────┘        │  │
                          │  │         │                   │                 │  │
                          │  │  ┌──────┴───────────────────┴──────┐          │  │
                          │  │  │       RDS PostgreSQL 16          │          │  │
                          │  │  │   (db subnet group, RDS SG)      │          │  │
                          │  │  └─────────────────────────────────┘          │  │
                          │  └─────────────────────────────────────────────┘  │
                          └─────────────────────────────────────────────────────┘
                                         │           │
                          ┌──────────────┘           └──────────────┐
                          ▼                                          ▼
                    ┌───────────┐                           ┌──────────────┐
                    │  S3 Bucket│                           │  Secrets Mgr │
                    │  (assets) │                           │  (DB creds)  │
                    └───────────┘                           └──────────────┘
                          │
                    ┌─────┴──────┐
                    │ CloudWatch │  Logs + Metrics (CW Agent + ALB access logs)
                    └────────────┘
```

Traffic flow:  
`Internet → ACM/ALB (port 80/443) → EC2 ASG (port 3001) → RDS PostgreSQL (port 5432)`  
Credentials: `EC2 IAM Role → Secrets Manager → DB_PASSWORD injected at boot`

---

## 2. Network Topology

### VPC CIDRs per environment

| Environment | VPC CIDR       | Public Subnets             | Private Subnets              |
|-------------|----------------|----------------------------|------------------------------|
| dev         | `10.0.0.0/16`  | `10.0.1.0/24`, `10.0.2.0/24` | `10.0.10.0/24`, `10.0.20.0/24` |
| staging     | `10.1.0.0/16`  | `10.1.1.0/24`, `10.1.2.0/24` | `10.1.10.0/24`, `10.1.20.0/24` |
| prod        | `10.2.0.0/16`  | `10.2.1.0/24`, `10.2.2.0/24` | `10.2.10.0/24`, `10.2.20.0/24` |

All environments span **2 Availability Zones** (`us-east-1a`, `us-east-1b`).

### Subnet tiers

| Tier    | Resources                    | Public IP | NAT route |
|---------|------------------------------|-----------|-----------|
| Public  | ALB, NAT Gateways, EIPs      | Yes       | Via IGW   |
| Private | EC2 (ASG), RDS               | No        | Via NAT GW (staging/prod) |

> **dev** has `enable_nat_gateway = false` to reduce costs — see [Audit §8.2](#82-bug--dev-ec2-has-no-internet-egress) for implications.

### Routing

- **Public route table:** `0.0.0.0/0 → Internet Gateway` (shared)
- **Private route tables:** `0.0.0.0/0 → NAT Gateway[AZ]` (one per AZ, staging/prod only)
- **VPC Flow Logs:** enabled in prod → CloudWatch (`/aws/vpc/flowlogs/liquidflow-prod`)

---

## 3. Component Breakdown

### 3.1 VPC Module (`modules/vpc`)

| Resource | Description |
|---|---|
| `aws_vpc` | DNS support + DNS hostnames enabled |
| `aws_subnet` (public × 2) | `map_public_ip_on_launch = true`, ALB placement |
| `aws_subnet` (private × 2) | EC2 + RDS, no public IP |
| `aws_internet_gateway` | Single IGW attached to VPC |
| `aws_eip` + `aws_nat_gateway` | One per AZ (staging/prod); disabled in dev |
| `aws_route_table` (public) | Shared: `0.0.0.0/0 → IGW` |
| `aws_route_table` (private × N) | Per-AZ: `0.0.0.0/0 → NAT GW[i]` |
| `aws_flow_log` | ALL traffic → CloudWatch (prod only) |

### 3.2 Security Groups (`modules/security`)

Three security groups with **zero open SSH** — access via SSM Session Manager only.

| SG | Inbound | Outbound |
|---|---|---|
| **ALB SG** | `:80` and `:443` from `0.0.0.0/0` | all |
| **EC2 SG** | `:3001` from ALB SG only | all |
| **RDS SG** | `:5432` from EC2 SG only | all |

> SSH port 22 is conditionally opened only if `ssh_allowed_cidrs` is non-empty. All environments set it to `[]`.

### 3.3 EC2 Module — ASG + ALB (`modules/ec2`)

| Resource | Description |
|---|---|
| `aws_launch_template` | Amazon Linux 2023, gp3 30 GB encrypted EBS, IMDSv2 enforced |
| `aws_autoscaling_group` | ELB health checks, 300 s grace period, Rolling instance refresh |
| `aws_autoscaling_policy` (×2) | Step scaling: +1 on high CPU, −1 on low CPU |
| `aws_cloudwatch_metric_alarm` (×2) | CPU scale-out and scale-in alarms |
| `aws_lb` (ALB) | Internet-facing, access logs → S3, deletion protection in prod |
| `aws_lb_target_group` | HTTP, port 3001, `GET /health` health checks |
| `aws_lb_listener` :80 | HTTP→HTTPS 301 redirect (if ACM cert present), else forward |
| `aws_lb_listener` :443 | HTTPS, TLS 1.3 (`ELBSecurityPolicy-TLS13-1-2-2021-06`) |
| `aws_s3_bucket` (ALB logs) | Encrypted, public-access blocked, ALB service account policy |

**Launch Template hardening:**
- `http_tokens = "required"` → IMDSv2 only (blocks SSRF metadata exploitation)
- `http_put_response_hop_limit = 1`
- Root volume: `gp3`, encrypted, deleted on termination

**User data bootstrap** (`modules/ec2/user_data.sh.tpl`):
1. `dnf update` + install git, curl, jq, unzip
2. Node.js 20 LTS via NodeSource
3. PM2 process manager
4. AWS CLI v2
5. CloudWatch Agent (custom config: memory, disk, CPU + log shipping)
6. Create `appuser`, fetch DB credentials from Secrets Manager, write `.env`

### 3.4 RDS Module (`modules/rds`)

| Resource | Description |
|---|---|
| `random_password` | 32-char random DB password (special chars) |
| `aws_secretsmanager_secret` | `/{project}/{env}/rds/master-credentials` |
| `aws_secretsmanager_secret_version` | JSON: username, password, host, port, dbname |
| `aws_db_subnet_group` | Private subnets only |
| `aws_db_parameter_group` | postgres16: slow query log, `pg_stat_statements` |
| `aws_iam_role` (Enhanced Monitoring) | `monitoring.rds.amazonaws.com` assume role |
| `aws_db_instance` | PostgreSQL 16.4, gp3, encryption at rest, `publicly_accessible = false` |

Key settings:
- **Storage encrypted:** always `true` (hardcoded in module)
- **Enhanced Monitoring:** 60-second intervals
- **Backup window:** `03:00-04:00 UTC`
- **Maintenance window:** `Sun 05:00-06:00 UTC`
- **Auto minor version upgrade:** enabled

### 3.5 S3 Module (`modules/s3`)

Each invocation creates **two** buckets:

| Bucket | Purpose |
|---|---|
| `{prefix}-{purpose}-{account_id}` | Main assets bucket |
| `{prefix}-{purpose}-logs-{account_id}` | S3 access logging target |

Hardening applied to both:
- Public access block (all 4 flags)
- AES-256 server-side encryption + bucket key
- Bucket policy enforcing `aws:SecureTransport = true` (deny HTTP)
- Lifecycle: STANDARD → STANDARD_IA → GLACIER (configurable days)
- Optional cross-region replication role + config (disabled by default)

### 3.6 IAM Module (`global/iam`)

One IAM role per environment for EC2 instances — strictly scoped:

| Policy | Scope |
|---|---|
| `AmazonSSMManagedInstanceCore` | AWS managed — SSM Session Manager access |
| `CloudWatchAgentServerPolicy` | AWS managed — CW agent metrics/logs |
| `{prefix}-ec2-s3-access` | `s3:GetObject/PutObject/DeleteObject` on project bucket objects only |
| `{prefix}-ec2-secrets-read` | `secretsmanager:GetSecretValue/DescribeSecret` on DB secret ARN only |

---

## 4. Security Model

### 4.1 Network isolation

```
Internet → [ALB SG :80/:443] → [EC2 SG :3001] → [RDS SG :5432]
                                      ↕
                               [SSM Session Manager]
                               (no inbound SSH port)
```

- RDS is **never publicly accessible** (`publicly_accessible = false`)
- EC2 is in **private subnets** — no direct internet exposure
- ALB is the **only public entry point**

### 4.2 Secrets

- DB password generated by `random_password` (32 chars), stored exclusively in Secrets Manager
- EC2 retrieves credentials at boot via `aws secretsmanager get-secret-value` using IAM role (no static keys)
- IAM policy scoped to the exact secret ARN

### 4.3 Encryption at rest

| Resource | Encryption |
|---|---|
| RDS | `storage_encrypted = true` (AES-256, always on) |
| EC2 EBS volumes | `encrypted = true` (gp3 root volume) |
| S3 buckets | AES-256 SSE + bucket key |
| ALB log bucket | AES-256 SSE |
| Terraform state bucket | AES-256 SSE (enforced by bootstrap.sh) |

### 4.4 Encryption in transit

- ALB HTTPS listener uses `ELBSecurityPolicy-TLS13-1-2-2021-06` (TLS 1.3 preferred)
- HTTP → HTTPS 301 redirect when ACM cert is present
- S3 bucket policy denies all requests without `aws:SecureTransport = true`
- Terraform state bucket policy denies HTTP (enforced by bootstrap.sh)

### 4.5 IMDSv2

All EC2 instances enforce IMDSv2 (`http_tokens = required`, hop limit = 1), preventing SSRF attacks that could leak IAM credentials from the metadata endpoint.

---

## 5. State Management

### Remote backend

| Resource | Name |
|---|---|
| S3 bucket | `liquidflow-terraform-state-{account_id}` |
| DynamoDB table | `liquidflow-terraform-locks` |
| State key (dev) | `dev/terraform.tfstate` |
| State key (staging) | `staging/terraform.tfstate` |
| State key (prod) | `prod/terraform.tfstate` |

Both the S3 bucket and DynamoDB table are created by `scripts/bootstrap.sh` **before** any `terraform init`. They are intentionally **not** Terraform-managed resources.

### Initialising a new environment

```bash
# 1. Bootstrap backend (run once)
cd backend/devOps/terraform/scripts
chmod +x bootstrap.sh
AWS_PROFILE=your-profile ./bootstrap.sh

# 2. Patch the account ID placeholder in backend.tf
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
find ../environments -name 'backend.tf' \
  -exec sed -i "s/<ACCOUNT_ID>/$ACCOUNT_ID/g" {} +

# 3. Init + plan
cd ../environments/dev
terraform init
terraform plan -var-file=terraform.tfvars

# 4. Or use the deploy script
cd ../../scripts
./deploy.sh dev plan
./deploy.sh dev apply
```

---

## 6. Environment Matrix

| Property | dev | staging | prod |
|---|---|---|---|
| **VPC CIDR** | `10.0.0.0/16` | `10.1.0.0/16` | `10.2.0.0/16` |
| **NAT Gateway** | ❌ | ✅ | ✅ |
| **VPC Flow Logs** | ❌ | ❌ | ✅ |
| **EC2 type** | t3.micro | t3.small | t3.medium |
| **ASG min/desired/max** | 1/1/2 | 1/1/3 | 2/2/6 |
| **Detailed monitoring** | ❌ | ✅ | ✅ |
| **CPU scale-out threshold** | 70 % | 65 % | 60 % |
| **CPU scale-in threshold** | 30 % | 25 % | 20 % |
| **RDS class** | db.t3.micro | db.t3.small | db.t3.medium |
| **RDS Multi-AZ** | ❌ | ❌ | ✅ |
| **RDS allocated storage** | 20 GB | 20 GB | 50 GB |
| **RDS max storage** | 50 GB | 100 GB | 200 GB |
| **Backup retention** | 3 days | 7 days | 14 days |
| **Performance Insights** | ❌ | ✅ | ✅ (7 days) |
| **Deletion protection** | ❌ | ❌ | ✅ |
| **Final snapshot** | skipped | skipped | ✅ |
| **Apply immediately** | ✅ | ❌ | ❌ |
| **S3 versioning** | ❌ | ✅ | ✅ |
| **S3 lifecycle transition** | 60 days | 30 days | 30 days |
| **HTTPS (ACM)** | optional | optional | required |
| **Secrets Manager recovery** | 7 days | 7 days | 30 days |
| **ALB deletion protection** | ❌ | ❌ | ✅ |

---

## 7. Terraform Layout

```
devOps/terraform/
├── environments/
│   ├── dev/           # Dev environment — cost-optimised, single-AZ
│   │   ├── main.tf        # Module wiring
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── backend.tf     # S3 remote state, key = dev/terraform.tfstate
│   │   ├── terraform.tfvars
│   │   └── versions.tf    # terraform ≥ 1.7.0, aws ~> 5.0, random ~> 3.6
│   ├── staging/       # Staging — HA-like, mirrors prod topology
│   └── prod/          # Production — Multi-AZ, deletion protection, full observability
│
├── global/
│   └── iam/           # EC2 IAM role + scoped policies (shared across envs)
│       ├── main.tf
│       ├── outputs.tf
│       └── variables.tf
│
├── modules/
│   ├── vpc/           # VPC, subnets, IGW, NAT GW, flow logs
│   ├── security/      # ALB/EC2/RDS security groups
│   ├── ec2/           # Launch template, ASG, ALB, listeners, CW alarms
│   ├── rds/           # PostgreSQL, Secrets Manager, parameter group, monitoring
│   └── s3/            # Application assets bucket + access log bucket
│
└── scripts/
    ├── bootstrap.sh   # Create S3 + DynamoDB backend (run once)
    └── deploy.sh      # Wrapper: init / plan / apply / destroy
```

## 8. Runbooks

### Deploy a new environment

```bash
cd backend/devOps/terraform/scripts

# First time only
./bootstrap.sh

# Deploy
./deploy.sh dev plan
./deploy.sh dev apply

# Check outputs
./deploy.sh dev output
```

### Roll out an infrastructure change

```bash
./deploy.sh staging plan    # Review plan
./deploy.sh staging apply   # Apply

# Promote to prod after staging validation
./deploy.sh prod plan
./deploy.sh prod apply      # Prompts for confirmation
```

### Emergency: connect to an EC2 instance

```bash
# No SSH key needed — SSM Session Manager
aws ssm start-session \
  --target <instance-id> \
  --region us-east-1 \
  --profile your-profile
```

### Rotate DB credentials

```bash
# Trigger Secrets Manager rotation (if rotation is configured)
aws secretsmanager rotate-secret \
  --secret-id /liquidflow/prod/rds/master-credentials

# Or manually update the secret and redeploy app instances
aws secretsmanager update-secret \
  --secret-id /liquidflow/prod/rds/master-credentials \
  --secret-string '{"username":"...","password":"..."}'
```

### Force ASG instance refresh (rolling deploy)

```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name liquidflow-prod-asg \
  --preferences '{"MinHealthyPercentage": 50, "InstanceWarmup": 300}'
```

Important notes

- The RDS `storage_encrypted` setting is intentionally defined inside the `modules/rds` module (hardcoded) to ensure storage is always encrypted for every module invocation. There is no exposed per-environment variable by design. If you need to change this, modify `modules/rds` to add a `storage_encrypted` variable and propagate it to the environment-level module calls, or update the module logic to match your encryption policy.

- Pending manual actions (require your AWS/account-specific values or an architectural decision):
  - Replace `<ACCOUNT_ID>` and `<CERT_ID>` placeholders in environment files (e.g., `environments/prod/backend.tf` and `environments/prod/terraform.tfvars`) after running the `scripts/bootstrap.sh` script. You can either patch the files as instructed by `bootstrap.sh` or pass the bucket via `terraform init -backend-config="bucket=liquidflow-terraform-state-<ACCOUNT_ID>"`. The placeholders cannot be auto-filled by this repo because they depend on your AWS account and certificate resources.
  - DB credentials are currently written to `/home/appuser/app/.env` by the instance user-data (fetched from Secrets Manager). If you prefer not to persist credentials on disk, change the application to retrieve secrets at runtime via the AWS SDK, or implement a runtime credential injection pattern (SSM Parameter Store, in-memory fetch, or short-lived credentials rotation). This is an architectural change that must be implemented in your application deployment strategy.