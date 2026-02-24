project_name = "liquidflow"
environment  = "prod"
aws_region   = "us-east-1"

# ─── Networking ───────────────────────────────────────────────────────────────
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# ─── EC2 ──────────────────────────────────────────────────────────────────────
ami_id        = "ami-0c02fb55956c7d316"
instance_type = "t3.medium"

# ─── RDS ──────────────────────────────────────────────────────────────────────
db_name           = "liquidflow_prod"
db_username       = "liquidflow_admin"
db_instance_class = "db.t3.medium"

# ─── HTTPS ────────────────────────────────────────────────────────────────────
# Replace with your ACM certificate ARN
certificate_arn = "arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERT_ID>"

# ─── Tags ─────────────────────────────────────────────────────────────────────
tags = {
  Owner      = "platform-team"
  CostCenter = "engineering"
}
