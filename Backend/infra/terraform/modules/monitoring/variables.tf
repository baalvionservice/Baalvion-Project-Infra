variable "project" {
  description = "Project name (used in resource naming)."
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. production, staging)."
  type        = string
}

variable "region" {
  description = "AWS region — used as the metric region in dashboard widgets."
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch retention (days) for the application/gateway log groups."
  type        = number
  default     = 90
}

variable "eks_cluster_name" {
  description = "EKS cluster name (ClusterName dimension for Container Insights widgets)."
  type        = string
}

variable "db_instance_id" {
  description = "RDS DBInstanceIdentifier. Empty string disables the RDS widgets/alarms."
  type        = string
  default     = ""
}

variable "redis_replication_group_id" {
  description = "ElastiCache replication group id. Empty string disables the Redis widgets/alarms."
  type        = string
  default     = ""
}

variable "alb_arn_suffix" {
  description = "ALB arn_suffix (LoadBalancer dimension). Empty string disables the ALB widgets/alarms."
  type        = string
  default     = ""
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications. Empty string disables alarm actions."
  type        = string
  default     = ""
}

variable "rds_free_storage_alarm_bytes" {
  description = "Trigger the RDS low-storage alarm below this many free bytes (default 5 GiB)."
  type        = number
  default     = 5368709120
}
