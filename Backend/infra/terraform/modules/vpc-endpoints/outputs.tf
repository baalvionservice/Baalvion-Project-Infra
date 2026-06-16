output "s3_endpoint_id" {
  description = "S3 gateway VPC endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "interface_endpoint_ids" {
  description = "Map of service short-name -> interface VPC endpoint ID"
  value       = { for k, e in aws_vpc_endpoint.interface : k => e.id }
}

output "security_group_id" {
  description = "Security group ID protecting the interface endpoints"
  value       = aws_security_group.endpoints.id
}
