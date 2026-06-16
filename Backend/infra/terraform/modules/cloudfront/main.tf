# ─────────────────────────────────────────────────────────────────────────────
# CloudFront distribution in front of a private S3 origin. Uses Origin Access
# Control (OAC) — the modern replacement for legacy OAI — so the bucket can stay
# fully private (public-access-block on) while CloudFront signs origin requests.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name            = "${var.project}-${var.environment}"
  origin_id       = "s3-${var.origin_bucket_id}"
  use_custom_cert = var.acm_certificate_arn != ""
}

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${local.name}-oac"
  description                       = "OAC for ${var.origin_bucket_id}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS-managed CachingOptimized policy (recommended for static assets).
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name} static assets"
  default_root_object = var.default_root_object
  price_class         = var.price_class
  aliases             = var.aliases

  origin {
    domain_name              = var.origin_domain_name
    origin_id                = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    target_origin_id       = local.origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.use_custom_cert ? false : true
    acm_certificate_arn            = local.use_custom_cert ? var.acm_certificate_arn : null
    ssl_support_method             = local.use_custom_cert ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_cert ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = { Name = "${local.name}-cdn" }
}

# Allow this distribution (and only this distribution) to read from the origin.
# This module OWNS the origin bucket's policy (the S3 module is told to skip its
# TLS-only policy for this bucket via unmanaged_policy_bucket_keys), so the
# DenyInsecureTransport statement is carried here to keep TLS-only enforcement.
data "aws_iam_policy_document" "oac_read" {
  statement {
    sid       = "AllowCloudFrontOACRead"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${var.origin_bucket_arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [var.origin_bucket_arn, "${var.origin_bucket_arn}/*"]
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

resource "aws_s3_bucket_policy" "oac_read" {
  bucket = var.origin_bucket_id
  policy = data.aws_iam_policy_document.oac_read.json
}
