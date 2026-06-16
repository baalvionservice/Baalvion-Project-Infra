# ── Monitoring module ───────────────────────────────────────────────────────────
# Application/gateway CloudWatch log groups with enforced retention, a single
# operational dashboard (EKS / RDS / ElastiCache / ALB), and SNS-wired alarms for
# the data stores and the edge. Widgets/alarms for a resource are only emitted when
# its identifier is supplied, so this module is safe to wire even when the ALB /
# Redis modules are count-disabled.

locals {
  name = "${var.project}-${var.environment}"

  # EKS (Container Insights — requires the amazon-cloudwatch-observability addon).
  eks_widgets = [
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "EKS — Node & Pod Count"
        region = var.region
        view   = "timeSeries"
        stat   = "Average"
        period = 300
        metrics = [
          ["ContainerInsights", "cluster_node_count", "ClusterName", var.eks_cluster_name],
          ["ContainerInsights", "cluster_failed_node_count", "ClusterName", var.eks_cluster_name],
          ["ContainerInsights", "cluster_running_pod_count", "ClusterName", var.eks_cluster_name]
        ]
      }
    },
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "EKS — Node CPU / Memory Utilization (%)"
        region = var.region
        view   = "timeSeries"
        stat   = "Average"
        period = 300
        metrics = [
          ["ContainerInsights", "node_cpu_utilization", "ClusterName", var.eks_cluster_name],
          ["ContainerInsights", "node_memory_utilization", "ClusterName", var.eks_cluster_name]
        ]
      }
    }
  ]

  rds_widgets = var.db_instance_id == "" ? [] : [
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "RDS — CPU & Connections"
        region = var.region
        view   = "timeSeries"
        stat   = "Average"
        period = 300
        metrics = [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_id],
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.db_instance_id]
        ]
      }
    },
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "RDS — Free Storage & Freeable Memory (bytes)"
        region = var.region
        view   = "timeSeries"
        stat   = "Average"
        period = 300
        metrics = [
          ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.db_instance_id],
          ["AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", var.db_instance_id]
        ]
      }
    }
  ]

  redis_widgets = var.redis_replication_group_id == "" ? [] : [
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "ElastiCache — CPU & Memory (%)"
        region = var.region
        view   = "timeSeries"
        stat   = "Average"
        period = 300
        metrics = [
          ["AWS/ElastiCache", "EngineCPUUtilization", "ReplicationGroupId", var.redis_replication_group_id],
          ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "ReplicationGroupId", var.redis_replication_group_id]
        ]
      }
    },
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "ElastiCache — Evictions & Current Connections"
        region = var.region
        view   = "timeSeries"
        stat   = "Sum"
        period = 300
        metrics = [
          ["AWS/ElastiCache", "Evictions", "ReplicationGroupId", var.redis_replication_group_id],
          ["AWS/ElastiCache", "CurrConnections", "ReplicationGroupId", var.redis_replication_group_id]
        ]
      }
    }
  ]

  alb_widgets = var.alb_arn_suffix == "" ? [] : [
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "ALB — Request Count & 5XX"
        region = var.region
        view   = "timeSeries"
        stat   = "Sum"
        period = 300
        metrics = [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
          ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix],
          ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix]
        ]
      }
    },
    {
      type   = "metric"
      width  = 12
      height = 6
      properties = {
        title  = "ALB — Target Response Time (p95, s)"
        region = var.region
        view   = "timeSeries"
        stat   = "p95"
        period = 300
        metrics = [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix]
        ]
      }
    }
  ]

  widgets = concat(local.eks_widgets, local.rds_widgets, local.redis_widgets, local.alb_widgets)

  alarm_actions = var.sns_topic_arn == "" ? [] : [var.sns_topic_arn]
}

# ── Application log groups (retention-enforced) ─────────────────────────────────
resource "aws_cloudwatch_log_group" "application" {
  name              = "/baalvion/${var.environment}/application"
  retention_in_days = var.log_retention_days
  tags              = { Name = "${local.name}-application-logs", env = var.environment }
}

resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/baalvion/${var.environment}/gateway"
  retention_in_days = var.log_retention_days
  tags              = { Name = "${local.name}-gateway-logs", env = var.environment }
}

# ── Operational dashboard ───────────────────────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name}-platform"
  dashboard_body = jsonencode({ widgets = local.widgets })
}

# ── Alarms → SNS ────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  count               = var.db_instance_id == "" ? 0 : 1
  alarm_name          = "${local.name}-rds-cpu-high"
  alarm_description   = "RDS CPU > 85% for 10 minutes."
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  dimensions          = { DBInstanceIdentifier = var.db_instance_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  count               = var.db_instance_id == "" ? 0 : 1
  alarm_name          = "${local.name}-rds-free-storage-low"
  alarm_description   = "RDS free storage below the configured floor."
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = { DBInstanceIdentifier = var.db_instance_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = var.rds_free_storage_alarm_bytes
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  count               = var.redis_replication_group_id == "" ? 0 : 1
  alarm_name          = "${local.name}-redis-cpu-high"
  alarm_description   = "ElastiCache engine CPU > 85% for 10 minutes."
  namespace           = "AWS/ElastiCache"
  metric_name         = "EngineCPUUtilization"
  dimensions          = { ReplicationGroupId = var.redis_replication_group_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  count               = var.alb_arn_suffix == "" ? 0 : 1
  alarm_name          = "${local.name}-alb-5xx-high"
  alarm_description   = "ALB target 5XX > 25 in 5 minutes."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  dimensions          = { LoadBalancer = var.alb_arn_suffix }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 25
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
}
