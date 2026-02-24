output "alb_sg_id" {
  description = "Security Group ID for the Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "ec2_sg_id" {
  description = "Security Group ID for EC2 application instances"
  value       = aws_security_group.ec2.id
}

output "rds_sg_id" {
  description = "Security Group ID for RDS — private, EC2-only access"
  value       = aws_security_group.rds.id
}
