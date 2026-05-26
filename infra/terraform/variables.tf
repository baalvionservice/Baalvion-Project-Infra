variable "project" {
  description = "Project name prefix used in all resource names"
  type        = string
  default     = "baalvion"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "region" {
  description = "Cloud provider region"
  type        = string
  default     = "ap-south-1"   # Mumbai — primary region
}

# ── Kubernetes ────────────────────────────────────────────────────────────────
variable "k8s_version" {
  description = "Kubernetes version for managed cluster"
  type        = string
  default     = "1.31"
}

variable "node_pool_min" {
  description = "Minimum nodes in the default node pool"
  type        = number
  default     = 2
}

variable "node_pool_max" {
  description = "Maximum nodes in the default node pool"
  type        = number
  default     = 6
}

variable "node_instance_type" {
  description = "Instance type / machine type for worker nodes"
  type        = string
  default     = "t3.medium"  # 2 vCPU / 4 GiB
}

# ── PostgreSQL ────────────────────────────────────────────────────────────────
variable "db_instance_class" {
  description = "RDS / Cloud SQL instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "baalvion_db"
}

variable "db_username" {
  description = "Master DB username"
  type        = string
  default     = "baalvion"
}

variable "db_password" {
  description = "Master DB password (injected via TF_VAR_db_password)"
  type        = string
  sensitive   = true
}

variable "db_storage_gb" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Enable Multi-AZ standby for PostgreSQL (production only)"
  type        = bool
  default     = false
}

# ── Redis ─────────────────────────────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache / Memorystore node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_auth_token" {
  description = "Redis AUTH token (injected via TF_VAR_redis_auth_token)"
  type        = string
  sensitive   = true
  default     = ""
}

# ── Networking ────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs to use for subnets"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ── Alerting ──────────────────────────────────────────────────────────────────
variable "alert_email" {
  description = "Email address for operational alerts"
  type        = string
  default     = "infra.baalvion@gmail.com"
}

# ── Global edge network ─────────────────────────────────────────────────────────
variable "proxy_dns_zone" {
  description = "Public DNS zone for proxy edge endpoints"
  type        = string
  default     = "proxy.baalvion.com"
}

variable "create_proxy_dns_zone" {
  description = "Create the Route53 hosted zone for the proxy edge (false if pre-existing)"
  type        = bool
  default     = false
}

variable "gateway_port" {
  description = "Gateway listener port used for edge health checks"
  type        = number
  default     = 8080
}

variable "edge_regions" {
  description = "Regions for Global Accelerator + GeoDNS steering (NLB ARNs per region). Empty = edge disabled."
  type = list(object({
    key          = string
    aws_region   = string
    endpoint_arn = string
    endpoint_dns = string
    continents   = list(string)
    weight       = optional(number, 100)
    is_default   = optional(bool, false)
  }))
  default = []
}
