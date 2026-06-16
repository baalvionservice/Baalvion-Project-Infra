variable "project"            {}
variable "environment"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "eks_sg_id"          {}
variable "db_instance_class"  {}
variable "db_name"            {}
variable "db_username"        {}
variable "db_password"        { sensitive = true }
variable "db_storage_gb"      { type = number }
variable "multi_az"           { type = bool }

locals {
  name = "${var.project}-${var.environment}"
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "${local.name}-db-subnets" }
}

resource "aws_security_group" "postgres" {
  name        = "${local.name}-postgres-sg"
  description = "Allow PostgreSQL from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
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

resource "aws_db_parameter_group" "postgres" {
  name   = "${local.name}-pg17"
  family = "postgres17"

  # Reject any non-TLS connection at the server. Combined with DB_SSL=true +
  # DB_SSL_REJECT_UNAUTHORIZED=true on the clients, this enforces in-transit
  # encryption end-to-end.
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # log queries > 1s
  }
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = "17.2"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  allocated_storage     = var.db_storage_gb
  max_allocated_storage = var.db_storage_gb * 5  # autoscaling up to 5x
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.postgres.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az               = var.multi_az
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name}-final-snapshot" : null

  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window           = "02:00-03:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  performance_insights_enabled = true

  tags = { Name = "${local.name}-postgres" }
}

output "endpoint" { value = aws_db_instance.postgres.endpoint }
output "db_name"  { value = aws_db_instance.postgres.db_name }
# DBInstanceIdentifier dimension for AWS/RDS CloudWatch metrics + alarms.
output "instance_id" { value = aws_db_instance.postgres.identifier }
