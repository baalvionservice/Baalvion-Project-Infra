variable "project" { type = string }
variable "environment" { type = string }

variable "secrets" {
  description = <<-EOT
    Map of logical secret name -> settings. The physical Secrets Manager name is
    "$${project}/$${environment}/<key>". Set initial_value only for bootstrap;
    prefer rotating/managing the value out of band afterwards.
  EOT
  type = map(object({
    description   = optional(string, "")
    initial_value = optional(string, "")
    recovery_days = optional(number, 7)
  }))
  default   = {}
  sensitive = true
}

variable "parameters" {
  description = <<-EOT
    Map of logical name -> non-secret SecureString SSM parameter. Path is
    "/$${project}/$${environment}/<key>". Use for config that benefits from
    centralised storage but is not a Secrets Manager rotation candidate.
  EOT
  type = map(object({
    value       = string
    description = optional(string, "")
  }))
  default   = {}
  sensitive = true
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN for encrypting secrets/parameters. Empty = AWS-managed key."
  type        = string
  default     = ""
}
