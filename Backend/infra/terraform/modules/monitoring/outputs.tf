output "dashboard_name" {
  description = "CloudWatch dashboard name."
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "application_log_group" {
  description = "Application log group name."
  value       = aws_cloudwatch_log_group.application.name
}

output "gateway_log_group" {
  description = "Gateway log group name."
  value       = aws_cloudwatch_log_group.gateway.name
}
