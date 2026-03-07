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

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ─── ACCESS LOGGING BUCKET ────────────────────────────────────────────────────
resource "aws_s3_bucket" "access_logs" {
  bucket        = "${local.name_prefix}-${var.bucket_purpose}-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.environment != "prod"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${var.bucket_purpose}-access-logs"
    Purpose = "s3-access-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket                  = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    id     = "expire-access-logs"
    status = "Enabled"
    expiration {
      days = 90
    }
  }
}

# ─── MAIN APPLICATION BUCKET ──────────────────────────────────────────────────
resource "aws_s3_bucket" "main" {
  bucket        = "${local.name_prefix}-${var.bucket_purpose}-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.environment != "prod"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${var.bucket_purpose}"
    Purpose = var.bucket_purpose
  })
}

# Block ALL public access — no exceptions
resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Server-side encryption (AES-256 + bucket key to reduce KMS costs)
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Access logging
resource "aws_s3_bucket_logging" "main" {
  bucket        = aws_s3_bucket.main.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access-logs/"
}

# Lifecycle rules — cost management
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition-standard-to-ia"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.lifecycle_transition_days + 60
      storage_class = "GLACIER"
    }
  }

  dynamic "rule" {
    for_each = var.versioning_enabled && var.lifecycle_expiration_days > 0 ? [1] : []
    content {
      id     = "expire-noncurrent-versions"
      status = "Enabled"
      noncurrent_version_expiration {
        noncurrent_days = var.lifecycle_expiration_days
      }
    }
  }
}

# Bucket policy — enforce HTTPS and restrict to authorized principals
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id
  policy = data.aws_iam_policy_document.main_bucket_policy.json

  depends_on = [aws_s3_bucket_public_access_block.main]
}

data "aws_iam_policy_document" "main_bucket_policy" {
  # Deny all unencrypted (HTTP) transport
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.main.arn,
      "${aws_s3_bucket.main.arn}/*"
    ]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Allow only authorized principals (no wildcard)
  dynamic "statement" {
    for_each = length(var.allowed_principal_arns) > 0 ? [1] : []
    content {
      sid    = "AllowAuthorizedPrincipals"
      effect = "Allow"
      actions = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.main.arn,
        "${aws_s3_bucket.main.arn}/*"
      ]
      principals {
        type        = "AWS"
        identifiers = var.allowed_principal_arns
      }
    }
  }
}

# ─── CROSS-REGION REPLICATION (optional, for DR) ──────────────────────────────
resource "aws_iam_role" "replication" {
  count = var.enable_replication ? 1 : 0
  name  = "${local.name_prefix}-${var.bucket_purpose}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "replication" {
  count = var.enable_replication ? 1 : 0
  name  = "${local.name_prefix}-${var.bucket_purpose}-s3-replication-policy"
  role  = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetReplicationConfiguration", "s3:ListBucket"]
        Resource = [aws_s3_bucket.main.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging"]
        Resource = ["${aws_s3_bucket.main.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"]
        Resource = ["${var.replication_destination_bucket_arn}/*"]
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "main" {
  count  = var.enable_replication && var.replication_destination_bucket_arn != null ? 1 : 0
  bucket = aws_s3_bucket.main.id
  role   = aws_iam_role.replication[0].arn

  rule {
    id     = "replicate-all"
    status = "Enabled"
    destination {
      bucket        = var.replication_destination_bucket_arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}
