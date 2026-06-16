# ─────────────────────────────────────────────────────────────────────────────
# S3 buckets (uploads / static assets / backups). Modern split resources:
# versioning, SSE, public-access-block, lifecycle, and a TLS-only bucket policy.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name     = "${var.project}-${var.environment}"
  use_kms  = var.kms_key_arn != ""
  sse_algo = local.use_kms ? "aws:kms" : "AES256"

  # Buckets whose aws_s3_bucket_policy is owned by another module (e.g. the
  # CloudFront module's OAC read policy). A bucket can hold only ONE policy, so we
  # skip the in-module TLS-only policy for these to avoid two resources fighting
  # over the same bucket on every apply. The owning module MUST include the
  # DenyInsecureTransport (TLS-only) statement in its policy instead.
  tls_only_buckets = {
    for k, v in var.buckets : k => v
    if !contains(var.unmanaged_policy_bucket_keys, k)
  }
}

resource "aws_s3_bucket" "this" {
  for_each = var.buckets

  bucket        = "${local.name}-${each.key}"
  force_destroy = each.value.force_destroy

  tags = { Name = "${local.name}-${each.key}" }
}

resource "aws_s3_bucket_versioning" "this" {
  for_each = var.buckets

  bucket = aws_s3_bucket.this[each.key].id
  versioning_configuration {
    status = each.value.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  for_each = var.buckets

  bucket = aws_s3_bucket.this[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = local.sse_algo
      kms_master_key_id = local.use_kms ? var.kms_key_arn : null
    }
    bucket_key_enabled = local.use_kms
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  for_each = var.buckets

  bucket                  = aws_s3_bucket.this[each.key].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "this" {
  for_each = var.buckets

  bucket = aws_s3_bucket.this[each.key].id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  for_each = var.buckets

  bucket = aws_s3_bucket.this[each.key].id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = each.value.abort_multipart_days
    }
  }

  dynamic "rule" {
    for_each = each.value.noncurrent_expiration_days > 0 ? [1] : []
    content {
      id     = "expire-noncurrent-versions"
      status = "Enabled"
      filter {}
      noncurrent_version_expiration {
        noncurrent_days = each.value.noncurrent_expiration_days
      }
    }
  }

  dynamic "rule" {
    for_each = each.value.transition_ia_days > 0 ? [1] : []
    content {
      id     = "transition-standard-ia"
      status = "Enabled"
      filter {}
      transition {
        days          = each.value.transition_ia_days
        storage_class = "STANDARD_IA"
      }
    }
  }

  dynamic "rule" {
    for_each = each.value.transition_glacier_days > 0 ? [1] : []
    content {
      id     = "transition-glacier"
      status = "Enabled"
      filter {}
      transition {
        days          = each.value.transition_glacier_days
        storage_class = "GLACIER"
      }
    }
  }

  dynamic "rule" {
    for_each = each.value.expiration_days > 0 ? [1] : []
    content {
      id     = "expire-current"
      status = "Enabled"
      filter {}
      expiration {
        days = each.value.expiration_days
      }
    }
  }
}

# Deny any non-TLS access to every managed bucket (except buckets whose policy is
# owned by another module — see local.tls_only_buckets).
data "aws_iam_policy_document" "tls_only" {
  for_each = local.tls_only_buckets

  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.this[each.key].arn,
      "${aws_s3_bucket.this[each.key].arn}/*",
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
}

resource "aws_s3_bucket_policy" "tls_only" {
  for_each = local.tls_only_buckets

  bucket = aws_s3_bucket.this[each.key].id
  policy = data.aws_iam_policy_document.tls_only[each.key].json

  depends_on = [aws_s3_bucket_public_access_block.this]
}
