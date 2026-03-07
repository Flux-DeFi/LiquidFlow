output "alb_dns_name" {
  description = "DNS name to access the application via the ALB"
  value       = module.ec2.alb_dns_name
}

output "alb_zone_id" {
  description = "Hosted Zone ID of the ALB (for Route53 alias records)"
  value       = module.ec2.alb_zone_id
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "db_identifier" {
  description = "RDS instance identifier"
  value       = module.rds.db_identifier
}

output "db_endpoint" {
  description = "RDS endpoint (hostname)"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret holding DB credentials"
  value       = module.rds.db_secret_arn
}

output "s3_assets_bucket" {
  description = "S3 assets bucket name"
  value       = module.s3_assets.bucket_id
}

output "ec2_asg_name" {
  description = "Auto Scaling Group name"
  value       = module.ec2.asg_name
}

output "ec2_instance_profile" {
  description = "EC2 instance profile name"
  value       = module.iam.ec2_instance_profile_name
}
