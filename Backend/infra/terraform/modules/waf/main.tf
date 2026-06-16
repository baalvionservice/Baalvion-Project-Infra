# ─────────────────────────────────────────────────────────────────────────────
# AWS WAFv2 regional web ACL for the ALB. Layers AWS managed rule groups
# (Common, KnownBadInputs, AmazonIpReputation) plus a rate-based rule, then
# associates the ACL with the supplied regional resource ARN (the ALB).
# scope = REGIONAL is required for ALB / API Gateway (CLOUDFRONT scope must be
# created in us-east-1 instead).
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name = "${var.project}-${var.environment}"
  # Priorities: managed groups occupy 0..N-1, rate rule sits after them.
  managed_rules = { for i, g in var.managed_rule_groups : g => i }
  rate_priority = length(var.managed_rule_groups)
}

resource "aws_wafv2_web_acl" "this" {
  name        = "${local.name}-web-acl"
  description = "Regional WAF for ${local.name} ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = local.managed_rules
    content {
      name     = rule.key
      priority = rule.value

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = replace(rule.key, "/[^A-Za-z0-9]/", "")
        sampled_requests_enabled   = true
      }
    }
  }

  rule {
    name     = "rate-limit"
    priority = local.rate_priority

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = { Name = "${local.name}-web-acl" }
}

resource "aws_wafv2_web_acl_association" "this" {
  count        = var.resource_arn != "" ? 1 : 0
  resource_arn = var.resource_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}
