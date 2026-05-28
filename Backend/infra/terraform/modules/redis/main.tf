variable "project"            {}
variable "environment"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "eks_sg_id"          {}
variable "node_type"          {}
variable "auth_token"         { sensitive = true }

locals {
  name          = "${var.project}-${var.environment}"
  use_auth      = var.auth_token != ""
  in_production = var.environment == "production"
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${local.name}-redis-subnets" }
}

resource "aws_security_group" "redis" {
  name        = "${local.name}-redis-sg"
  description = "Allow Redis from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.eks_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${local.name}-redis7"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  parameter {
    name  = "activedefrag"
    value = "yes"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.name}-redis"
  description          = "Baalvion ${var.environment} Redis cluster"

  node_type            = var.node_type
  num_cache_clusters   = local.in_production ? 2 : 1  # primary + replica in prod
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = local.use_auth  # TLS required when auth_token is set
  auth_token                 = local.use_auth ? var.auth_token : null

  automatic_failover_enabled = local.in_production
  multi_az_enabled           = local.in_production

  snapshot_retention_limit = local.in_production ? 3 : 0
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:05:00-sun:06:00"

  engine_version = "7.1"

  tags = { Name = "${local.name}-redis" }
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}
output "reader_endpoint" {
  value = aws_elasticache_replication_group.redis.reader_endpoint_address
}
