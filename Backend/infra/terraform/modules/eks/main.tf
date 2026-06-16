variable "project"            {}
variable "environment"        {}
variable "k8s_version"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "node_pool_min"      { type = number }
variable "node_pool_max"      { type = number }
variable "node_instance_type" {}
variable "public_access_cidrs" {
  description = "CIDRs allowed to reach the public EKS API endpoint. Restrict to office/VPN/CI ranges in production."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
variable "log_retention_days" {
  description = "CloudWatch retention (days) for the EKS control-plane log group."
  type        = number
  default     = 90
}
variable "enable_container_insights" {
  description = "Install the amazon-cloudwatch-observability addon (Container Insights — pod/node logs + metrics to CloudWatch)."
  type        = bool
  default     = true
}

locals {
  cluster_name = "${var.project}-${var.environment}-eks"
}

# ── IAM roles ─────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "eks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster" {
  name               = "${local.cluster_name}-role"
  assume_role_policy = data.aws_iam_policy_document.eks_assume.json
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

data "aws_iam_policy_document" "node_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${local.cluster_name}-node-role"
  assume_role_policy = data.aws_iam_policy_document.node_assume.json
}

resource "aws_iam_role_policy_attachment" "node_worker" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "node_cni" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "node_ecr" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# CloudWatch agent permissions on the nodes — required for Container Insights
# (the amazon-cloudwatch-observability addon ships pod/node logs + metrics).
resource "aws_iam_role_policy_attachment" "node_cloudwatch" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ── Control-plane log group ─────────────────────────────────────────────────────
# EKS auto-creates /aws/eks/<cluster>/cluster on first enable WITHOUT retention
# (logs kept forever = cost + compliance gap). Declaring it here pins retention
# (and optional KMS) and makes the cluster depend on it, so the named group is the
# Terraform-managed one. The name MUST match the convention EKS expects exactly.
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${local.cluster_name}-control-plane-logs"
    env  = var.environment
  }
}

# ── Control plane ──────────────────────────────────────────────────────────────
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.k8s_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.public_access_cidrs
  }

  # Full control-plane audit trail: API server, audit, authenticator, plus the
  # controller manager and scheduler (omitting these two hides reconcile/scheduling
  # failures during incidents).
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster,
    aws_cloudwatch_log_group.eks,
  ]
}

# ── Managed node group ─────────────────────────────────────────────────────────
resource "aws_eks_node_group" "default" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-default-ng"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids

  instance_types = [var.node_instance_type]
  disk_size      = 30

  scaling_config {
    min_size     = var.node_pool_min
    max_size     = var.node_pool_max
    desired_size = var.node_pool_min
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = "general"
    env  = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_worker,
    aws_iam_role_policy_attachment.node_cni,
    aws_iam_role_policy_attachment.node_ecr,
  ]
}

# ── Container Insights (amazon-cloudwatch-observability addon) ──────────────────
# Ships pod/node logs + metrics to CloudWatch so workload logging is validated end
# to end, not just control-plane logging. Uses the node role's CloudWatch agent
# permissions (attached above). OVERWRITE lets Terraform own the addon config even
# if EKS pre-installed a default.
resource "aws_eks_addon" "observability" {
  count                       = var.enable_container_insights ? 1 : 0
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "amazon-cloudwatch-observability"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [
    aws_eks_node_group.default,
    aws_iam_role_policy_attachment.node_cloudwatch,
  ]
}

# ── Security group for nodes (referenced by RDS / ElastiCache modules) ─────────
resource "aws_security_group" "nodes" {
  name        = "${local.cluster_name}-nodes-sg"
  description = "EKS worker nodes"
  vpc_id      = var.vpc_id

  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "cluster_name"          { value = aws_eks_cluster.main.name }
output "control_plane_log_group" { value = aws_cloudwatch_log_group.eks.name }
output "cluster_endpoint"      { value = aws_eks_cluster.main.endpoint }
output "cluster_ca"            { value = aws_eks_cluster.main.certificate_authority[0].data }
output "node_security_group_id" { value = aws_security_group.nodes.id }

# EKS-managed "cluster security group" — automatically attached to the managed
# node group's ENIs (the standalone aws_security_group.nodes is NOT, because the
# node group has no launch template). Data stores (RDS / ElastiCache) must allow
# ingress from THIS sg to actually reach the pods.
output "cluster_primary_security_group_id" {
  value = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}
