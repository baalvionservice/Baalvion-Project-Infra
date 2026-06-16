# ─────────────────────────────────────────────────────────────────────────────
# VPC endpoints to keep AWS-API traffic on the private AWS network and cut NAT
# egress cost:
#   - S3        : Gateway endpoint (route-table entry, no ENI / no hourly cost)
#   - others    : Interface endpoints (ENI per subnet, private DNS enabled)
# ─────────────────────────────────────────────────────────────────────────────

locals {
  name = "${var.project}-${var.environment}"
}

# Security group for interface endpoints — allow HTTPS from within the VPC.
data "aws_vpc" "selected" {
  id = var.vpc_id
}

resource "aws_security_group" "endpoints" {
  name        = "${local.name}-vpce-sg"
  description = "Allow HTTPS from the VPC to interface endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-vpce-sg" }
}

# Gateway endpoint for S3 — associated with the private route tables.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.private_route_table_ids

  tags = { Name = "${local.name}-vpce-s3" }
}

# Interface endpoints for control-plane services.
resource "aws_vpc_endpoint" "interface" {
  for_each = var.interface_services

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true

  tags = { Name = "${local.name}-vpce-${replace(each.value, ".", "-")}" }
}
