variable "project" { type = string }
variable "environment" { type = string }

variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the HTTPS (443) listener"
  type        = string
}

variable "ingress_cidrs" {
  description = "CIDR blocks permitted to reach the ALB on 80/443"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "target_port" {
  description = "Port the default target group forwards to"
  type        = number
  default     = 80
}

variable "target_protocol" {
  description = "Protocol for the default target group (HTTP | HTTPS)"
  type        = string
  default     = "HTTP"
}

variable "health_check_path" {
  description = "Health-check path for the default target group"
  type        = string
  default     = "/healthz"
}

variable "ssl_policy" {
  description = "ELB security policy for the HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "enable_deletion_protection" {
  description = "Protect the ALB from accidental deletion"
  type        = bool
  default     = false
}
