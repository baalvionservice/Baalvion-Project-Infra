variable "project" { type = string }
variable "environment" { type = string }

variable "kms_key_arn" {
  description = "Optional KMS key ARN for SSE. When empty, AES256 (SSE-S3) is used."
  type        = string
  default     = ""
}

variable "buckets" {
  description = <<-EOT
    Map of logical bucket name -> settings. The physical bucket name is
    "$${project}-$${environment}-<key>". Each bucket gets versioning,
    server-side encryption, and a full public-access block.
  EOT
  type = map(object({
    versioning_enabled = optional(bool, true)
    force_destroy      = optional(bool, false)
    # Days after which noncurrent versions expire (0 = never).
    noncurrent_expiration_days = optional(number, 90)
    # Days after which current objects expire (0 = never; e.g. backups TTL).
    expiration_days = optional(number, 0)
    # Days after which objects transition to STANDARD_IA (0 = never).
    transition_ia_days = optional(number, 0)
    # Days after which objects transition to GLACIER (0 = never).
    transition_glacier_days = optional(number, 0)
    # Abort incomplete multipart uploads after N days.
    abort_multipart_days = optional(number, 7)
  }))
  default = {
    uploads = { versioning_enabled = true, noncurrent_expiration_days = 90 }
    assets  = { versioning_enabled = true, noncurrent_expiration_days = 30 }
    backups = { versioning_enabled = true, transition_glacier_days = 30, expiration_days = 365 }
  }
}
