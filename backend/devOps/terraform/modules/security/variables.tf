variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Security Groups will be created"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC (used for intra-VPC rules)"
  type        = string
}

variable "app_port" {
  description = "Application port the backend listens on"
  type        = number
  default     = 3001
}

variable "rds_port" {
  description = "Port for RDS (PostgreSQL)"
  type        = number
  default     = 5432
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed SSH access. Empty = no SSH (use SSM instead)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
