provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── VPC ─────────────────────────────────────────────────────────────────────
module "vpc" {
  source = "../../modules/vpc"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
  enable_nat_gateway   = true
  enable_vpc_flow_logs = false  # Enable in staging if compliance requires it
  tags                 = var.tags
}

# ─── SECURITY GROUPS ─────────────────────────────────────────────────────────
module "security" {
  source = "../../modules/security"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  vpc_cidr          = module.vpc.vpc_cidr_block
  app_port          = 3001
  rds_port          = 5432
  ssh_allowed_cidrs = []
  tags              = var.tags
}

# ─── S3 ──────────────────────────────────────────────────────────────────────
module "s3_assets" {
  source = "../../modules/s3"

  project_name              = var.project_name
  environment               = var.environment
  bucket_purpose            = "assets"
  versioning_enabled        = true
  lifecycle_transition_days = 30
  lifecycle_expiration_days = 60
  tags                      = var.tags
}

# ─── RDS (PostgreSQL) ─────────────────────────────────────────────────────────
module "rds" {
  source = "../../modules/rds"

  project_name                  = var.project_name
  environment                   = var.environment
  private_subnet_ids            = module.vpc.private_subnet_ids
  rds_sg_id                     = module.security.rds_sg_id
  db_name                       = var.db_name
  db_username                   = var.db_username
  engine_version                = "16.4"
  instance_class                = var.db_instance_class
  allocated_storage             = 20
  max_allocated_storage         = 100
  multi_az                      = false   # Single-AZ in staging
  backup_retention_period       = 7
  deletion_protection           = false
  skip_final_snapshot           = true
  performance_insights_enabled  = true
  apply_immediately             = false
  tags                          = var.tags
}

# ─── IAM ─────────────────────────────────────────────────────────────────────
module "iam" {
  source = "../../global/iam"

  project_name   = var.project_name
  environment    = var.environment
  s3_bucket_arns = [module.s3_assets.bucket_arn]
  db_secret_arns = [module.rds.db_secret_arn]
  tags           = var.tags
}

# ─── EC2 (Auto Scaling Group + ALB) ──────────────────────────────────────────
module "ec2" {
  source = "../../modules/ec2"

  project_name         = var.project_name
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  public_subnet_ids    = module.vpc.public_subnet_ids
  private_subnet_ids   = module.vpc.private_subnet_ids
  ec2_sg_id            = module.security.ec2_sg_id
  alb_sg_id            = module.security.alb_sg_id
  instance_type        = var.instance_type
  ami_id               = var.ami_id
  key_name             = var.key_name
  iam_instance_profile = module.iam.ec2_instance_profile_name
  app_port             = 3001
  health_check_path    = "/health"
  min_size             = 1
  max_size             = 3
  desired_capacity     = 1
  certificate_arn      = var.certificate_arn
  enable_detailed_monitoring = true
  cpu_scale_out_threshold    = 65
  cpu_scale_in_threshold     = 25

  user_data = base64encode(templatefile("${path.module}/../../modules/ec2/user_data.sh.tpl", {
    project_name  = var.project_name
    environment   = var.environment
    db_secret_arn = module.rds.db_secret_arn
    db_endpoint   = module.rds.db_endpoint
    db_port       = module.rds.db_port
    db_name       = module.rds.db_name
    app_port      = 3001
    aws_region    = var.aws_region
  }))

  tags = var.tags
}
