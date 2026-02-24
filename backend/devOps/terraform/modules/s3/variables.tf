variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "bucket_purpose" {
  description = "Purpose of this bucket, used in naming (e.g. 'assets', 'backups', 'uploads')"
  type        = string
}

variable "versioning_enabled" {
  description = "Enable versioning on the bucket"
  type        = bool
  default     = true
}

variable "lifecycle_transition_days" {
  description = "Days before objects transition from STANDARD to STANDARD_IA"
  type        = number
  default     = 30
}

variable "lifecycle_expiration_days" {
  description = "Days before noncurrent object versions are permanently deleted (0 = disabled)"
  type        = number
  default     = 90
}

variable "enable_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_destination_bucket_arn" {
  description = "ARN of the destination bucket for cross-region replication"
  type        = string
  default     = null
}

variable "allowed_principal_arns" {
  description = "IAM principal ARNs allowed to access this bucket (no wildcards)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
