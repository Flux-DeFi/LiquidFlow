variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "s3_bucket_arns" {
  description = "ARNs of S3 buckets EC2 instances are allowed to access"
  type        = list(string)
  default     = []
}

variable "db_secret_arns" {
  description = "ARNs of Secrets Manager secrets EC2 instances may read (DB credentials)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
