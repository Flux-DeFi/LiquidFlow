project_name = "liquidflow"
environment  = "dev"
aws_region   = "us-east-1"

# Networking
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# EC2
# Amazon Linux 2023 (us-east-1) — update for other regions
ami_id        = "ami-0c02fb55956c7d316"
instance_type = "t3.micro"

# RDS
db_name           = "liquidflow_dev"
db_username       = "liquidflow_admin"
db_instance_class = "db.t3.micro"

# Tags
tags = {
  Owner      = "platform-team"
  CostCenter = "engineering"
}
