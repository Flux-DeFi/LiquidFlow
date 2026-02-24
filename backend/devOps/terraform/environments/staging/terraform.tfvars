project_name = "liquidflow"
environment  = "staging"
aws_region   = "us-east-1"

# ─── Networking ───────────────────────────────────────────────────────────────
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# ─── EC2 ──────────────────────────────────────────────────────────────────────
ami_id        = "ami-0c02fb55956c7d316"
instance_type = "t3.small"

# ─── RDS ──────────────────────────────────────────────────────────────────────
db_name           = "liquidflow_staging"
db_username       = "liquidflow_admin"
db_instance_class = "db.t3.small"

# ─── Tags ─────────────────────────────────────────────────────────────────────
tags = {
  Owner      = "platform-team"
  CostCenter = "engineering"
}
