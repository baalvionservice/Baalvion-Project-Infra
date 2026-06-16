output "repository_urls" {
  description = "Map of service name -> ECR repository URL"
  value       = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

output "repository_arns" {
  description = "Map of service name -> ECR repository ARN"
  value       = { for k, r in aws_ecr_repository.this : k => r.arn }
}

output "registry_id" {
  description = "AWS account / registry ID hosting the repositories"
  value       = length(aws_ecr_repository.this) > 0 ? values(aws_ecr_repository.this)[0].registry_id : null
}
