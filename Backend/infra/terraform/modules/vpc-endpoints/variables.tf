variable "project" { type = string }
variable "environment" { type = string }
variable "region" { type = string }

variable "vpc_id" {
  description = "VPC to attach endpoints to"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for interface (ENI-backed) endpoints"
  type        = list(string)
}

variable "private_route_table_ids" {
  description = "Private route table IDs to associate with the S3 gateway endpoint"
  type        = list(string)
}

variable "interface_services" {
  description = "AWS service short-names to expose as interface endpoints (reduces NAT egress)"
  type        = set(string)
  default     = ["secretsmanager", "ssm", "ecr.api", "ecr.dkr"]
}
