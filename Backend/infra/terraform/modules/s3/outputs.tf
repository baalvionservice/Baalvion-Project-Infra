output "bucket_ids" {
  description = "Map of logical key -> physical bucket name"
  value       = { for k, b in aws_s3_bucket.this : k => b.id }
}

output "bucket_arns" {
  description = "Map of logical key -> bucket ARN"
  value       = { for k, b in aws_s3_bucket.this : k => b.arn }
}

output "bucket_regional_domain_names" {
  description = "Map of logical key -> regional domain name (for CloudFront origins)"
  value       = { for k, b in aws_s3_bucket.this : k => b.bucket_regional_domain_name }
}
