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
  description = "AMI ID for EC2 instances (Amazon Linux 2023 recommended)"
  type        = string
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
