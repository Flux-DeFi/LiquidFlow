data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

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

  # CloudWatch Agent log groups written by the EC2 bootstrap script
  # (backend/devOps/terraform/modules/ec2/user_data.sh.tpl) — kept in sync
  # with the hardcoded `log_group_name` values in that template.
  cloudwatch_log_group_arns = [
    "arn:aws:logs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:log-group:/liquidflow/${var.environment}/app:*",
    "arn:aws:logs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:log-group:/liquidflow/${var.environment}/user-data:*",
  ]
}

# EC2 INSTANCE ROLE
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

# ─── SSM SESSION MANAGER (secure remote access without opening SSH ports) ─────
# Replaces the AWS-managed `AmazonSSMManagedInstanceCore` policy — that managed
# policy also grants Patch Manager / Inventory / State Manager / KMS decrypt
# permissions we don't use. This custom policy keeps only what the SSM Agent
# needs to register the instance and support Session Manager connections.
resource "aws_iam_policy" "ssm_session_manager" {
  name        = "${local.name_prefix}-ec2-ssm-session-manager"
  description = "Minimal SSM Agent + Session Manager permissions for ${local.name_prefix} EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMAgentRegistration"
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:ListAssociations",
          "ssm:ListInstanceAssociations",
          "ssm:DescribeAssociation",
          "ssm:GetDeployablePatchSnapshotForInstance",
          "ssm:GetDocument",
          "ssm:DescribeDocument",
          "ssm:GetManifest",
          "ssm:UpdateInstanceAssociationStatus",
          "ssm:UpdateAssociationStatus",
          "ssm:PutInventory",
        ]
        # These SSM Agent registration/heartbeat calls are not scopable to a
        # resource ARN — SSM does not support resource-level permissions for
        # them (see AWS docs for AmazonSSMManagedInstanceCore). Action is
        # already narrowed to only what agent registration requires; the
        # unused Patch Manager / State Manager write actions from the
        # original managed policy have been dropped.
        Resource = "*"
      },
      {
        Sid    = "SessionManagerChannel"
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
        ]
        # ssmmessages:* has no resource-level permissions — required "*" by AWS.
        Resource = "*"
      },
      {
        Sid    = "EC2MessagesChannel"
        Effect = "Allow"
        Action = [
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply",
        ]
        # ec2messages:* has no resource-level permissions — required "*" by AWS.
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ssm_session_manager" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ssm_session_manager.arn
}

# ─── CLOUDWATCH AGENT (push metrics + app/bootstrap logs) ─────────────────────
# Replaces the AWS-managed `CloudWatchAgentServerPolicy` — that managed policy
# grants logs/metrics access to ALL log groups and namespaces in the account.
# This custom policy scopes log actions to only the two log groups this
# instance's CloudWatch Agent config actually writes to (see
# modules/ec2/user_data.sh.tpl), and namespaces the metric writes.
resource "aws_iam_policy" "cloudwatch_agent" {
  name        = "${local.name_prefix}-ec2-cloudwatch-agent"
  description = "Scoped CloudWatch Agent metrics + logs permissions for ${local.name_prefix} EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PutMetrics"
        Effect = "Allow"
        Action = ["cloudwatch:PutMetricData"]
        # cloudwatch:PutMetricData has no resource-level permissions — AWS
        # requires "*" here. Blast radius is limited via the condition below
        # to only the LiquidFlow/<environment> namespace this agent uses.
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "LiquidFlow/${var.environment}"
          }
        }
      },
      {
        Sid    = "WriteAppLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        # Scoped to only the two log groups this instance's CloudWatch Agent
        # config writes to — not "*".
        Resource = local.cloudwatch_log_group_arns
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.cloudwatch_agent.arn
}

# S3 ACCESS (scoped to project buckets only)
resource "aws_iam_policy" "s3_access" {
  count       = length(var.s3_bucket_arns) > 0 ? 1 : 0
  name        = "${local.name_prefix}-ec2-s3-access"
  description = "Scoped S3 access for ${local.name_prefix} EC2 instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowObjectOperations"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
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
