variable "project" { type = string }
variable "environment" { type = string }

variable "repositories" {
  description = <<-EOT
    Service names to create ECR repositories for. The physical repo name is
    "$${project}/<service>". One repository is created per entry via for_each.
  EOT
  type        = set(string)
  default     = []
}

variable "image_tag_mutability" {
  description = "IMMUTABLE (recommended for prod) or MUTABLE"
  type        = string
  default     = "IMMUTABLE"
}

variable "scan_on_push" {
  description = "Run image vulnerability scanning automatically on push"
  type        = bool
  default     = true
}

variable "keep_last_images" {
  description = "Number of most-recent images to retain (lifecycle policy expires older)"
  type        = number
  default     = 20
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN for repository encryption. Empty = AES256."
  type        = string
  default     = ""
}
