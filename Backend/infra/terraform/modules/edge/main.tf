# ─────────────────────────────────────────────────────────────────────────────
# Global edge steering for the Baalvion proxy data plane.
#
# Two cooperating layers:
#   1. AWS Global Accelerator (Anycast) — two static anycast IPs announced from
#      every AWS edge PoP. Clients connect to the nearest PoP and GA forwards
#      over the AWS backbone to the closest HEALTHY regional gateway NLB. This is
#      the primary low-latency/failover layer. client_affinity = SOURCE_IP keeps
#      a given client pinned to one region for sticky proxy sessions.
#   2. Route53 GeoDNS — geolocation routing for the public proxy hostname plus
#      region-pinned hostnames (e.g. eu.<zone> for GDPR data-residency). Each
#      record is health-checked so a dead region drops out of DNS.
# ─────────────────────────────────────────────────────────────────────────────

variable "project"     { type = string }
variable "environment" { type = string }

variable "dns_zone_name" {
  description = "Public DNS zone for proxy endpoints, e.g. proxy.baalvion.com"
  type        = string
}

variable "create_dns_zone" {
  description = "Create the Route53 hosted zone (false if it already exists)"
  type        = bool
  default     = true
}

variable "proxy_port" {
  description = "Primary gateway listener port used for health checks"
  type        = number
  default     = 8080
}

variable "listener_port_ranges" {
  description = "Proxy ports exposed via Global Accelerator (HTTP, HTTPS-CONNECT, SOCKS5)"
  type        = list(object({ from_port = number, to_port = number }))
  default = [
    { from_port = 80, to_port = 80 },     # HTTP forward proxy
    { from_port = 443, to_port = 443 },   # HTTPS CONNECT
    { from_port = 1080, to_port = 1080 }, # SOCKS5
    { from_port = 8080, to_port = 8080 }, # gateway control listener
  ]
}

# One object per region. endpoint_arn is the regional gateway NLB ARN (created by
# the in-cluster load-balancer controller); endpoint_dns is its DNS name used for
# region-pinned/geo CNAMEs; continents are Route53 continent codes served here.
variable "regions" {
  description = "Edge regions to steer traffic across"
  type = list(object({
    key          = string         # us-east, eu, india, sea, ...
    aws_region   = string         # us-east-1, eu-west-1, ap-south-1, ...
    endpoint_arn = string         # NLB ARN for Global Accelerator endpoint group
    endpoint_dns = string         # NLB DNS name for Route53 CNAME records
    continents   = list(string)   # ["NA"], ["EU"], ["AS"], ["OC"], ...
    weight       = optional(number, 100)
    is_default   = optional(bool, false) # GeoDNS catch-all + GA primary
  }))
}

locals {
  name        = "${var.project}-${var.environment}"
  regions_map = { for r in var.regions : r.key => r }
  # Exactly one region flagged default → used for the GeoDNS catch-all record.
  default_region = one([for r in var.regions : r if r.is_default])
}

# ── Layer 1: Global Accelerator (Anycast) ────────────────────────────────────
resource "aws_globalaccelerator_accelerator" "edge" {
  name            = "${local.name}-edge"
  ip_address_type = "IPV4"
  enabled         = true
}

resource "aws_globalaccelerator_listener" "proxy" {
  accelerator_arn = aws_globalaccelerator_accelerator.edge.id
  protocol        = "TCP"
  client_affinity = "SOURCE_IP" # sticky region per client for sticky sessions

  dynamic "port_range" {
    for_each = var.listener_port_ranges
    content {
      from_port = port_range.value.from_port
      to_port   = port_range.value.to_port
    }
  }
}

resource "aws_globalaccelerator_endpoint_group" "region" {
  for_each = local.regions_map

  listener_arn          = aws_globalaccelerator_listener.proxy.id
  endpoint_group_region = each.value.aws_region

  # Health: TCP probe on the gateway port; unhealthy region is drained.
  health_check_protocol         = "TCP"
  health_check_port             = var.proxy_port
  health_check_interval_seconds = 10
  threshold_count               = 3
  traffic_dial_percentage       = 100

  endpoint_configuration {
    endpoint_id                    = each.value.endpoint_arn
    weight                         = each.value.weight
    client_ip_preservation_enabled = true
  }
}

# ── Layer 2: Route53 GeoDNS ───────────────────────────────────────────────────
resource "aws_route53_zone" "proxy" {
  count = var.create_dns_zone ? 1 : 0
  name  = var.dns_zone_name
}

data "aws_route53_zone" "proxy" {
  count = var.create_dns_zone ? 0 : 1
  name  = var.dns_zone_name
}

locals {
  zone_id = var.create_dns_zone ? aws_route53_zone.proxy[0].zone_id : data.aws_route53_zone.proxy[0].zone_id
  # AWS-published hosted-zone id for all Global Accelerator anycast endpoints.
  ga_hosted_zone_id = "Z2BJ6XQ5FK7U4H"
}

# Per-region TCP health check on the gateway port — drives GeoDNS failover.
resource "aws_route53_health_check" "region" {
  for_each          = local.regions_map
  fqdn              = each.value.endpoint_dns
  port              = var.proxy_port
  type              = "TCP"
  request_interval  = 10
  failure_threshold = 3
  tags              = { Name = "${local.name}-${each.key}-health" }
}

# Apex of the proxy zone → Global Accelerator anycast (alias). evaluate_target_health
# lets Route53 pull the record if GA itself reports unhealthy.
resource "aws_route53_record" "apex_ga" {
  zone_id = local.zone_id
  name    = var.dns_zone_name
  type    = "A"

  alias {
    name                   = aws_globalaccelerator_accelerator.edge.dns_name
    zone_id                = local.ga_hosted_zone_id
    evaluate_target_health = true
  }
}

# Region-pinned hostnames (<key>.<zone>) — explicit, for data-residency / testing.
resource "aws_route53_record" "region_pinned" {
  for_each = local.regions_map
  zone_id  = local.zone_id
  name     = "${each.key}.${var.dns_zone_name}"
  type     = "CNAME"
  ttl      = 60
  records  = [each.value.endpoint_dns]
}

# Geolocation routing on geo.<zone>: each continent steered to its region, with
# health checks so a dead region falls through to the default record.
resource "aws_route53_record" "geo" {
  for_each = {
    for pair in flatten([
      for r in var.regions : [
        for c in r.continents : { key = "${r.key}-${c}", region = r, continent = c }
      ]
    ]) : pair.key => pair
  }

  zone_id        = local.zone_id
  name           = "geo.${var.dns_zone_name}"
  type           = "CNAME"
  ttl            = 60
  set_identifier = each.key
  records        = [each.value.region.endpoint_dns]
  health_check_id = aws_route53_health_check.region[each.value.region.key].id

  geolocation_routing_policy {
    continent = each.value.continent
  }
}

# Mandatory catch-all for geolocation routing (unmatched locations → default region).
resource "aws_route53_record" "geo_default" {
  zone_id         = local.zone_id
  name            = "geo.${var.dns_zone_name}"
  type            = "CNAME"
  ttl             = 60
  set_identifier  = "default"
  records         = [local.default_region.endpoint_dns]
  health_check_id = aws_route53_health_check.region[local.default_region.key].id

  geolocation_routing_policy {
    country = "*"
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "accelerator_dns_name" {
  description = "Global Accelerator DNS name (anycast entrypoint)"
  value       = aws_globalaccelerator_accelerator.edge.dns_name
}

output "accelerator_ip_sets" {
  description = "The two static anycast IPv4 addresses announced globally"
  value       = aws_globalaccelerator_accelerator.edge.ip_sets
}

output "proxy_zone_id" {
  description = "Route53 hosted zone id for the proxy DNS zone"
  value       = local.zone_id
}

output "proxy_zone_name_servers" {
  description = "Delegate these name servers from the registrar (when zone created here)"
  value       = var.create_dns_zone ? aws_route53_zone.proxy[0].name_servers : []
}
