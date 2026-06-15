terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state — S3 + DynamoDB locking
  # Initialise with: terraform init -backend-config=backend.hcl
  backend "s3" {
    bucket         = "baalvion-terraform-state"
    key            = "baalvion/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "baalvion-terraform-locks"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Networking ────────────────────────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  project              = var.project
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ── Kubernetes (EKS) ──────────────────────────────────────────────────────────
module "eks" {
  source = "./modules/eks"

  project            = var.project
  environment        = var.environment
  k8s_version        = var.k8s_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_pool_min      = var.node_pool_min
  node_pool_max      = var.node_pool_max
  node_instance_type = var.node_instance_type
}

# ── PostgreSQL (RDS) ──────────────────────────────────────────────────────────
module "postgres" {
  source = "./modules/postgres"

  project            = var.project
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  eks_sg_id          = module.eks.node_security_group_id

  db_instance_class = var.db_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  db_storage_gb     = var.db_storage_gb
  multi_az          = var.db_multi_az
}

# ── Redis (ElastiCache) ───────────────────────────────────────────────────────
module "redis" {
  source = "./modules/redis"

  project            = var.project
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  eks_sg_id          = module.eks.node_security_group_id
  node_type          = var.redis_node_type
  auth_token         = var.redis_auth_token
}

# ── Helm: cert-manager ────────────────────────────────────────────────────────
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    command     = "aws"
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
      command     = "aws"
    }
  }
}

resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  version          = "v1.15.0"
  namespace        = "cert-manager"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }
}

resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "0.9.20"
  namespace        = "external-secrets"
  create_namespace = true
}

# ── Kubernetes namespace bootstrap ───────────────────────────────────────────
resource "kubernetes_namespace" "baalvion" {
  metadata {
    name = "baalvion"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = var.environment
    }
  }

  depends_on = [module.eks]
}

# ── Global edge: Anycast (Global Accelerator) + GeoDNS (Route53) ──────────────
# Enabled once regional gateway NLB ARNs are known (multi-region rollout). Until
# then leave edge_regions = [] and this module provisions nothing.
module "edge" {
  source = "./modules/edge"
  count  = length(var.edge_regions) > 0 ? 1 : 0

  project         = var.project
  environment     = var.environment
  dns_zone_name   = var.proxy_dns_zone
  create_dns_zone = var.create_proxy_dns_zone
  proxy_port      = var.gateway_port
  regions         = var.edge_regions
}

# ── S3 buckets (uploads / assets / backups) ──────────────────────────────────
module "s3" {
  source = "./modules/s3"
  count  = var.enable_s3 ? 1 : 0

  project     = var.project
  environment = var.environment
  kms_key_arn = var.s3_kms_key_arn
  buckets     = var.s3_buckets
}

# ── CloudFront CDN in front of the S3 assets bucket ──────────────────────────
# Requires enable_s3 so the origin bucket exists. The CloudFront module owns the
# origin bucket policy (OAC read), so do not also point another policy at it.
module "cloudfront" {
  source = "./modules/cloudfront"
  count  = var.enable_cloudfront && var.enable_s3 ? 1 : 0

  project     = var.project
  environment = var.environment

  origin_bucket_id    = module.s3[0].bucket_ids[var.cloudfront_origin_bucket_key]
  origin_bucket_arn   = module.s3[0].bucket_arns[var.cloudfront_origin_bucket_key]
  origin_domain_name  = module.s3[0].bucket_regional_domain_names[var.cloudfront_origin_bucket_key]
  aliases             = var.cloudfront_aliases
  acm_certificate_arn = var.cloudfront_acm_certificate_arn
}

# ── Application Load Balancer (internet-facing) ───────────────────────────────
module "alb" {
  source = "./modules/alb"
  count  = var.enable_alb ? 1 : 0

  project             = var.project
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  acm_certificate_arn = var.alb_acm_certificate_arn
  ingress_cidrs       = var.alb_ingress_cidrs
}

# ── WAFv2 web ACL (regional) attached to the ALB ──────────────────────────────
module "waf" {
  source = "./modules/waf"
  count  = var.enable_waf ? 1 : 0

  project      = var.project
  environment  = var.environment
  rate_limit   = var.waf_rate_limit
  resource_arn = var.enable_alb ? module.alb[0].alb_arn : ""
}

# ── ECR repositories (one per service) ────────────────────────────────────────
module "ecr" {
  source = "./modules/ecr"
  count  = var.enable_ecr ? 1 : 0

  project              = var.project
  environment          = var.environment
  repositories         = var.ecr_repositories
  keep_last_images     = var.ecr_keep_last_images
  image_tag_mutability = var.ecr_image_tag_mutability
}

# ── Secrets Manager + SSM Parameter Store ─────────────────────────────────────
module "secrets" {
  source = "./modules/secrets"
  count  = var.enable_secrets ? 1 : 0

  project     = var.project
  environment = var.environment
  secrets     = var.secrets
  parameters  = var.ssm_parameters
  kms_key_arn = var.secrets_kms_key_arn
}

# ── VPC endpoints (S3 gateway + interface endpoints to cut NAT egress) ────────
module "vpc_endpoints" {
  source = "./modules/vpc-endpoints"
  count  = var.enable_vpc_endpoints ? 1 : 0

  project                 = var.project
  environment             = var.environment
  region                  = var.region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  private_route_table_ids = module.vpc.private_route_table_ids
}

# ── SNS topic for alerts ──────────────────────────────────────────────────────
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "email_alert" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
