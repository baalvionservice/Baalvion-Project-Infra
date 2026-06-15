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
  default     = "ap-south-1" # Mumbai — primary region
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
  default     = "t3.medium" # 2 vCPU / 4 GiB
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

# ── Feature flags (all default OFF — adding these modules must not disrupt an
#    existing `terraform apply`) ────────────────────────────────────────────────
variable "enable_s3" {
  type    = bool
  default = false
}
variable "enable_cloudfront" {
  type    = bool
  default = false
}
variable "enable_alb" {
  type    = bool
  default = false
}
variable "enable_waf" {
  type    = bool
  default = false
}
variable "enable_ecr" {
  type    = bool
  default = false
}
variable "enable_secrets" {
  type    = bool
  default = false
}
variable "enable_vpc_endpoints" {
  type    = bool
  default = false
}

# ── S3 ────────────────────────────────────────────────────────────────────────
variable "s3_kms_key_arn" {
  description = "Optional KMS key ARN for S3 SSE. Empty = AES256 (SSE-S3)."
  type        = string
  default     = ""
}

variable "s3_buckets" {
  description = "Logical bucket name -> lifecycle/versioning settings (see modules/s3)."
  type = map(object({
    versioning_enabled         = optional(bool, true)
    force_destroy              = optional(bool, false)
    noncurrent_expiration_days = optional(number, 90)
    expiration_days            = optional(number, 0)
    transition_ia_days         = optional(number, 0)
    transition_glacier_days    = optional(number, 0)
    abort_multipart_days       = optional(number, 7)
  }))
  default = {
    uploads = { versioning_enabled = true, noncurrent_expiration_days = 90 }
    assets  = { versioning_enabled = true, noncurrent_expiration_days = 30 }
    backups = { versioning_enabled = true, transition_glacier_days = 30, expiration_days = 365 }
  }
}

# ── CloudFront ──────────────────────────────────────────────────────────────────
variable "cloudfront_origin_bucket_key" {
  description = "Which s3_buckets key serves as the CloudFront origin (requires enable_s3)."
  type        = string
  default     = "assets"
}

variable "cloudfront_aliases" {
  description = "Custom domain CNAMEs for the CloudFront distribution."
  type        = list(string)
  default     = []
}

variable "cloudfront_acm_certificate_arn" {
  description = "ACM cert ARN for CloudFront custom domain (MUST be in us-east-1). Empty = default cert."
  type        = string
  default     = ""
}

# ── ALB ─────────────────────────────────────────────────────────────────────────
variable "alb_acm_certificate_arn" {
  description = "ACM cert ARN for the ALB HTTPS (443) listener (regional)."
  type        = string
  default     = ""
}

variable "alb_ingress_cidrs" {
  description = "CIDRs permitted to reach the ALB on 80/443."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ── WAF ─────────────────────────────────────────────────────────────────────────
variable "waf_rate_limit" {
  description = "Requests per 5-min window per IP before the WAF rate rule blocks."
  type        = number
  default     = 2000
}

# ── ECR ─────────────────────────────────────────────────────────────────────────
variable "ecr_repositories" {
  description = "Service names to create ECR repositories for (one repo each)."
  type        = set(string)
  default     = []
}

variable "ecr_keep_last_images" {
  description = "Number of most-recent images each ECR repo retains."
  type        = number
  default     = 20
}

variable "ecr_image_tag_mutability" {
  description = "IMMUTABLE (recommended) or MUTABLE for ECR repos."
  type        = string
  default     = "IMMUTABLE"
}

# ── Secrets Manager / SSM ─────────────────────────────────────────────────────────
variable "secrets" {
  description = "Logical secret name -> settings (see modules/secrets)."
  type = map(object({
    description   = optional(string, "")
    initial_value = optional(string, "")
    recovery_days = optional(number, 7)
  }))
  default   = {}
  sensitive = true
}

variable "ssm_parameters" {
  description = "Logical name -> non-secret SecureString SSM parameter (see modules/secrets)."
  type = map(object({
    value       = string
    description = optional(string, "")
  }))
  default   = {}
  sensitive = true
}

variable "secrets_kms_key_arn" {
  description = "Optional KMS key ARN for Secrets Manager / SSM. Empty = AWS-managed key."
  type        = string
  default     = ""
}
