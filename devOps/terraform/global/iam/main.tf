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

# ─── EC2 INSTANCE ROLE ────────────────────────────────────────────────────────
resource "aws_iam_role" "ec2" {
  name        = "${local.name_prefix}-ec2-role"
  description = "Role for ${local.name_prefix} EC2 instances — least privilege"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# SSM Session Manager — secure remote access without opening SSH ports
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch Agent — push metrics and logs
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ─── S3 ACCESS (scoped to project buckets only) ───────────────────────────────
resource "aws_iam_policy" "s3_access" {
  count       = length(var.s3_bucket_arns) > 0 ? 1 : 0
  name        = "${local.name_prefix}-ec2-s3-access"
  description = "Scoped S3 access for ${local.name_prefix} EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowObjectOperations"
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = [for arn in var.s3_bucket_arns : "${arn}/*"]
      },
      {
        Sid      = "AllowBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.s3_bucket_arns
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  count      = length(var.s3_bucket_arns) > 0 ? 1 : 0
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_access[0].arn
}

# ─── SECRETS MANAGER (read DB credentials only) ───────────────────────────────
resource "aws_iam_policy" "secrets_read" {
  count       = length(var.db_secret_arns) > 0 ? 1 : 0
  name        = "${local.name_prefix}-ec2-secrets-read"
  description = "Allows EC2 to read DB credentials from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ReadDBSecrets"
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ]
      Resource = var.db_secret_arns
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "secrets_read" {
  count      = length(var.db_secret_arns) > 0 ? 1 : 0
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.secrets_read[0].arn
}

# ─── EC2 INSTANCE PROFILE ─────────────────────────────────────────────────────
resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}
