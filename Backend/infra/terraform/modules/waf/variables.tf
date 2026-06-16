variable "project" { type = string }
variable "environment" { type = string }

variable "resource_arn" {
  description = "ARN of the regional resource to associate (e.g. the ALB ARN). Empty = create the web ACL but skip association."
  type        = string
  default     = ""
}

variable "rate_limit" {
  description = "Requests per 5-minute window per source IP before the rate-based rule blocks"
  type        = number
  default     = 2000
}

variable "managed_rule_groups" {
  description = "AWS managed rule groups to enable (in priority order)"
  type        = list(string)
  default = [
    "AWSManagedRulesCommonRuleSet",
    "AWSManagedRulesKnownBadInputsRuleSet",
    "AWSManagedRulesAmazonIpReputationList",
  ]
}
