locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# ─── ALB SECURITY GROUP ───────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-sg-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-alb"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ─── EC2 SECURITY GROUP ───────────────────────────────────────────────────────
resource "aws_security_group" "ec2" {
  name        = "${local.name_prefix}-sg-ec2"
  description = "Security group for EC2 application instances"
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port from ALB only"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  dynamic "ingress" {
    for_each = length(var.ssh_allowed_cidrs) > 0 ? [1] : []
    content {
      description = "SSH from allowed CIDRs"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_allowed_cidrs
    }
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-ec2"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ─── RDS SECURITY GROUP ───────────────────────────────────────────────────────
# RDS is never directly reachable from internet — only from EC2 SG
resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-sg-rds"
  description = "Security group for RDS — accessible only from EC2"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2 only"
    from_port       = var.rds_port
    to_port         = var.rds_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sg-rds"
  })

  lifecycle {
    create_before_destroy = true
  }
}
