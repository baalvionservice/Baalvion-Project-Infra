output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "db_endpoint" {
  description = "PostgreSQL RDS endpoint (host:port)"
  value       = module.postgres.endpoint
  sensitive   = true
}

output "db_name" {
  description = "PostgreSQL database name"
  value       = module.postgres.db_name
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.primary_endpoint
  sensitive   = true
}

output "sns_alert_topic_arn" {
  description = "SNS topic ARN for operational alerts"
  value       = aws_sns_topic.alerts.arn
}

# ── Global edge ────────────────────────────────────────────────────────────────
output "edge_accelerator_dns" {
  description = "Global Accelerator anycast DNS entrypoint (null until edge_regions set)"
  value       = length(module.edge) > 0 ? module.edge[0].accelerator_dns_name : null
}

output "edge_anycast_ips" {
  description = "Static anycast IPv4 addresses for the proxy edge"
  value       = length(module.edge) > 0 ? module.edge[0].accelerator_ip_sets : []
}

output "edge_zone_name_servers" {
  description = "Name servers to delegate for the proxy DNS zone"
  value       = length(module.edge) > 0 ? module.edge[0].proxy_zone_name_servers : []
}

# ── S3 / CloudFront / ALB / WAF / ECR (feature-flagged modules) ───────────────
output "s3_bucket_ids" {
  description = "Map of logical key -> S3 bucket name (empty when enable_s3 = false)"
  value       = length(module.s3) > 0 ? module.s3[0].bucket_ids : {}
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain (null when enable_cloudfront = false)"
  value       = length(module.cloudfront) > 0 ? module.cloudfront[0].domain_name : null
}

output "alb_dns_name" {
  description = "Public ALB DNS name (null when enable_alb = false)"
  value       = length(module.alb) > 0 ? module.alb[0].alb_dns_name : null
}

output "alb_arn" {
  description = "ALB ARN (null when enable_alb = false)"
  value       = length(module.alb) > 0 ? module.alb[0].alb_arn : null
}

output "alb_zone_id" {
  description = "ALB hosted zone ID for Route53 alias records (null when enable_alb = false)"
  value       = length(module.alb) > 0 ? module.alb[0].alb_zone_id : null
}

output "waf_web_acl_arn" {
  description = "WAFv2 web ACL ARN (null when enable_waf = false)"
  value       = length(module.waf) > 0 ? module.waf[0].web_acl_arn : null
}

output "ecr_repository_urls" {
  description = "Map of service -> ECR repo URL (empty when enable_ecr = false)"
  value       = length(module.ecr) > 0 ? module.ecr[0].repository_urls : {}
}

output "secret_arns" {
  description = "Map of logical secret name -> Secrets Manager ARN (empty when enable_secrets = false)"
  value       = length(module.secrets) > 0 ? module.secrets[0].secret_arns : {}
}

output "ssm_parameter_arns" {
  description = "Map of logical name -> SSM parameter ARN (empty when enable_secrets = false)"
  value       = length(module.secrets) > 0 ? module.secrets[0].parameter_arns : {}
}

output "secrets_read_policy_json" {
  description = "IAM policy JSON granting read access to the managed secrets/parameters — attach to the IRSA / task role (null when enable_secrets = false or nothing managed)"
  value       = length(module.secrets) > 0 ? module.secrets[0].read_policy_json : null
}

output "eks_node_security_group_id" {
  description = "EKS cluster security group attached to managed nodes (for adding data-store ingress rules)"
  value       = module.eks.cluster_primary_security_group_id
}

# ── kubectl config command ────────────────────────────────────────────────────
output "kubeconfig_command" {
  description = "Run this command to update your local kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}
