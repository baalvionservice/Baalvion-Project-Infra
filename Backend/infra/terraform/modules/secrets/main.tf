# ─────────────────────────────────────────────────────────────────────────────
# AWS Secrets Manager secrets + optional SSM Parameter Store SecureStrings.
# Emits an IAM policy document granting read access to exactly these resources,
# for attachment to IRSA / ECS task roles.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name       = "${var.project}-${var.environment}"
  kms_key    = var.kms_key_arn != "" ? var.kms_key_arn : null
  param_root = "/${var.project}/${var.environment}"
}

resource "aws_secretsmanager_secret" "this" {
  # for_each cannot iterate a sensitive value (the keys would leak as resource addresses).
  # Secret NAMES are not sensitive, so iterate the keys via nonsensitive() and pull the
  # sensitive fields (description/value) by key where they are actually used.
  for_each = nonsensitive(toset(keys(var.secrets)))

  name                    = "${var.project}/${var.environment}/${each.key}"
  description             = var.secrets[each.key].description
  kms_key_id              = local.kms_key
  recovery_window_in_days = var.secrets[each.key].recovery_days

  tags = { Name = "${local.name}-${each.key}" }
}

# Seed an initial version only when a bootstrap value is supplied. Subsequent
# value changes should be made out of band so Terraform does not own the secret.
resource "aws_secretsmanager_secret_version" "this" {
  for_each = nonsensitive(toset([for k, v in var.secrets : k if v.initial_value != ""]))

  secret_id     = aws_secretsmanager_secret.this[each.key].id
  secret_string = var.secrets[each.key].initial_value

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_ssm_parameter" "this" {
  for_each = nonsensitive(toset(keys(var.parameters)))

  name        = "${local.param_root}/${each.key}"
  description = var.parameters[each.key].description
  type        = "SecureString"
  value       = var.parameters[each.key].value
  key_id      = local.kms_key

  tags = { Name = "${local.name}-${each.key}" }
}

# Read-only policy scoped to the managed secrets + parameters (for task roles).
data "aws_iam_policy_document" "read" {
  dynamic "statement" {
    for_each = nonsensitive(length(var.secrets)) > 0 ? [1] : []
    content {
      sid       = "ReadSecrets"
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      resources = [for s in aws_secretsmanager_secret.this : s.arn]
    }
  }

  dynamic "statement" {
    for_each = nonsensitive(length(var.parameters)) > 0 ? [1] : []
    content {
      sid       = "ReadParameters"
      effect    = "Allow"
      actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
      resources = [for p in aws_ssm_parameter.this : p.arn]
    }
  }
}
