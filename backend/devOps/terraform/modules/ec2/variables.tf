variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the Target Group"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the Auto Scaling Group"
  type        = list(string)
}

variable "ec2_sg_id" {
  description = "Security Group ID for EC2 instances"
  type        = string
}

variable "alb_sg_id" {
  description = "Security Group ID for the ALB"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "Optional AMI ID override for EC2 instances. Leave null to auto-resolve the latest Amazon Linux 2023 (x86_64) AMI for the configured region via the aws_ami data source."
  type        = string
  default     = null
}

variable "key_name" {
  description = "EC2 Key Pair name for emergency SSH access. Prefer SSM Session Manager."
  type        = string
  default     = null
}

variable "iam_instance_profile" {
  description = "Name of the IAM Instance Profile to attach to EC2 instances"
  type        = string
}

variable "app_port" {
  description = "Application port the backend listens on"
  type        = number
  default     = 3001
}

variable "health_check_path" {
  description = "HTTP path for ALB health checks"
  type        = string
  default     = "/health"
}

variable "min_size" {
  description = "Minimum number of EC2 instances in the ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of EC2 instances in the ASG"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of EC2 instances"
  type        = number
  default     = 1
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS. If null, ALB will use plain HTTP."
  type        = string
  default     = null
}

variable "user_data" {
  description = "Base64-encoded user data bootstrap script"
  type        = string
  default     = null
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed (1-minute) CloudWatch monitoring for EC2 instances"
  type        = bool
  default     = false
}

variable "cpu_scale_out_threshold" {
  description = "CPU utilization % threshold to trigger scale-out"
  type        = number
  default     = 70
}

variable "cpu_scale_in_threshold" {
  description = "CPU utilization % threshold to trigger scale-in"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ─────────────────────────────────────────────────────────────────────────────
# Disk / memory exhaustion alarms (see main.tf for the alarm resources and
# user_data.sh.tpl for the CloudWatch agent config that publishes the metrics)
# ─────────────────────────────────────────────────────────────────────────────

variable "disk_utilization_threshold" {
  description = "Root-volume disk utilization %% above which the disk-high alarm fires. Default 85% leaves roughly 15% headroom on the 30GB gp3 root volume so there's time to rotate logs, clear caches, or resize the volume before the disk actually fills and writes start failing."
  type        = number
  default     = 85
}

variable "memory_utilization_threshold" {
  description = "Memory utilization %% above which the memory-high alarm fires. Default 90% because the Node.js/PM2 app runs on memory-constrained instance types (e.g. t3.micro); sustained usage above 90% risks the OOM killer terminating the process before PM2 can recover gracefully."
  type        = number
  default     = 90
}

variable "alarm_evaluation_periods" {
  description = "Number of consecutive periods a disk/memory threshold breach must persist before the alarm fires. Default 3 avoids paging on a single noisy sample while still catching a sustained exhaustion trend quickly."
  type        = number
  default     = 3
}

variable "alarm_period_seconds" {
  description = "Evaluation period, in seconds, for the disk/memory alarms. Matches the CloudWatch agent's 60s metrics_collection_interval configured in user_data.sh.tpl."
  type        = number
  default     = 60
}

variable "sns_alarm_emails" {
  description = "Optional list of email addresses to subscribe to the EC2 resource-alarm SNS topic (disk/memory exhaustion notifications)"
  type        = list(string)
  default     = []
}
