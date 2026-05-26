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

# ── kubectl config command ────────────────────────────────────────────────────
output "kubeconfig_command" {
  description = "Run this command to update your local kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}
