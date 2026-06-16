output "alb_arn" {
  description = "ALB ARN (for WAF association)"
  value       = aws_lb.this.arn
}

output "arn_suffix" {
  description = "ALB ARN suffix (the LoadBalancer dimension for AWS/ApplicationELB CloudWatch metrics)"
  value       = aws_lb.this.arn_suffix
}

output "alb_dns_name" {
  description = "Public DNS name of the ALB"
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias records)"
  value       = aws_lb.this.zone_id
}

output "https_listener_arn" {
  description = "HTTPS (443) listener ARN (for additional rules)"
  value       = aws_lb_listener.https.arn
}

output "http_listener_arn" {
  description = "HTTP (80) redirect listener ARN"
  value       = aws_lb_listener.http_redirect.arn
}

output "default_target_group_arn" {
  description = "Default target group ARN"
  value       = aws_lb_target_group.default.arn
}

output "security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}
