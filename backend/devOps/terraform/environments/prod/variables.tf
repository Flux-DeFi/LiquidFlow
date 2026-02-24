variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment identifier"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB)"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (EC2, RDS)"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones (minimum 2 for HA)"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (Amazon Linux 2023)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "EC2 Key Pair name (prefer SSM Session Manager)"
  type        = string
  default     = null
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database"
  type        = string
  default     = "liquidflow"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (required in prod)"
  type        = string

  validation {
    condition     = can(regex("^arn:aws:acm:", var.certificate_arn))
    error_message = "certificate_arn must be a valid ACM ARN (arn:aws:acm:...). HTTPS is required in production."
  }
}

variable "tags" {
  description = "Extra tags applied to all resources"
  type        = map(string)
  default     = {}
}
