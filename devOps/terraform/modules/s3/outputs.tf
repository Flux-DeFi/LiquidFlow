output "bucket_id" {
  description = "The name/ID of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "Regional domain name of the bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "bucket_region" {
  description = "AWS region where the bucket resides"
  value       = data.aws_region.current.name
}

output "access_logs_bucket_id" {
  description = "Name/ID of the access logging bucket"
  value       = aws_s3_bucket.access_logs.id
}
