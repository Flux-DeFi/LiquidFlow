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

# VPC
module "vpc" {
  source = "../../modules/vpc"
  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
  enable_nat_gateway   = false # NAT Gateway not needed in dev to reduce costs
  enable_vpc_flow_logs = false  # Disabled in dev to reduce costs
  tags                 = var.tags
}

# SECURITY GROUPS
module "security" {
  source = "../../modules/security"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  vpc_cidr          = module.vpc.vpc_cidr_block
  app_port          = 3001
  rds_port          = 5432
  ssh_allowed_cidrs = []  # Use SSM Session Manager — no SSH port needed
  tags              = var.tags
}

# S3 (application assets / file uploads)
module "s3_assets" {
  source = "../../modules/s3"

  project_name              = var.project_name
  environment               = var.environment
  bucket_purpose            = "assets"
  versioning_enabled        = false  # Disabled in dev
  lifecycle_transition_days = 60
  lifecycle_expiration_days = 30
  tags                      = var.tags
}

# RDS (PostgreSQL)
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
  max_allocated_storage         = 50
  multi_az                      = false   # Single-AZ in dev
  backup_retention_period       = 3
  deletion_protection           = false
  skip_final_snapshot           = true
  performance_insights_enabled  = false   # Disabled in dev
  apply_immediately             = true
  tags                          = var.tags
  storage_encrypted             = true # Always encrypt storage, even in dev
}

# IAM (EC2 instance role + scoped policies)
module "iam" {
  source = "../../global/iam"

  project_name   = var.project_name
  environment    = var.environment
  s3_bucket_arns = [module.s3_assets.bucket_arn]
  db_secret_arns = [module.rds.db_secret_arn]
  tags           = var.tags
}

# EC2 (Auto Scaling Group + ALB)
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
  max_size             = 2
  desired_capacity     = 1
  certificate_arn      = var.certificate_arn
  enable_detailed_monitoring = false
  cpu_scale_out_threshold    = 70
  cpu_scale_in_threshold     = 30

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
