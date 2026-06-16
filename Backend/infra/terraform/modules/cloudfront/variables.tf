variable "project" { type = string }
variable "environment" { type = string }

variable "origin_bucket_id" {
  description = "ID (name) of the S3 bucket serving as the CloudFront origin"
  type        = string
}

variable "origin_bucket_arn" {
  description = "ARN of the origin S3 bucket (used in the OAC bucket policy)"
  type        = string
}

variable "origin_domain_name" {
  description = "Regional domain name of the origin S3 bucket"
  type        = string
}

variable "aliases" {
  description = "Optional custom domain names (CNAMEs) served by the distribution"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = <<-EOT
    ACM certificate ARN for the custom domain. MUST be issued in us-east-1
    for CloudFront. Empty = use the default *.cloudfront.net certificate.
  EOT
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_All | PriceClass_200 | PriceClass_100)"
  type        = string
  default     = "PriceClass_200"
}

variable "default_root_object" {
  description = "Default root object served at the distribution root"
  type        = string
  default     = "index.html"
}
