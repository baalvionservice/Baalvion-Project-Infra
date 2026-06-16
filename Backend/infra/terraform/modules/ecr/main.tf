# ─────────────────────────────────────────────────────────────────────────────
# ECR repositories — one per service via for_each. Scan-on-push, configurable
# tag immutability, and a lifecycle policy that keeps only the last N images.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name    = "${var.project}-${var.environment}"
  use_kms = var.kms_key_arn != ""
}

resource "aws_ecr_repository" "this" {
  for_each = var.repositories

  name                 = "${var.project}/${each.value}"
  image_tag_mutability = var.image_tag_mutability
  force_delete         = var.environment != "production"

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = local.use_kms ? "KMS" : "AES256"
    kms_key         = local.use_kms ? var.kms_key_arn : null
  }

  tags = { Name = "${var.project}/${each.value}" }
}

# Expire all but the most recent N images.
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = aws_ecr_repository.this
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.keep_last_images} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.keep_last_images
        }
        action = { type = "expire" }
      }
    ]
  })
}
