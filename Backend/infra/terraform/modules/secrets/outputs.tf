output "secret_arns" {
  description = "Map of logical secret name -> Secrets Manager ARN"
  value       = { for k, s in aws_secretsmanager_secret.this : k => s.arn }
}

output "parameter_arns" {
  description = "Map of logical name -> SSM parameter ARN"
  value       = { for k, p in aws_ssm_parameter.this : k => p.arn }
}

output "read_policy_json" {
  description = "IAM policy JSON granting read access to these secrets/parameters (attach to IRSA/task roles). Null when nothing is managed."
  value       = (length(var.secrets) + length(var.parameters)) > 0 ? data.aws_iam_policy_document.read.json : null
}
