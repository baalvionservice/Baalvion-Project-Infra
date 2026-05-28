variable "project"            {}
variable "environment"        {}
variable "k8s_version"        {}
variable "vpc_id"             {}
variable "private_subnet_ids" { type = list(string) }
variable "node_pool_min"      { type = number }
variable "node_pool_max"      { type = number }
variable "node_instance_type" {}

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

# ── Control plane ──────────────────────────────────────────────────────────────
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.k8s_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true  # Restrict in production to specific CIDRs
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [aws_iam_role_policy_attachment.eks_cluster]
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
output "cluster_endpoint"      { value = aws_eks_cluster.main.endpoint }
output "cluster_ca"            { value = aws_eks_cluster.main.certificate_authority[0].data }
output "node_security_group_id" { value = aws_security_group.nodes.id }
