package com.baalvion.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWebhookRequest {

  @NotBlank(message = "url required")
  @Pattern(regexp = "^https?://.+", message = "url must be http(s)")
  @Size(max = 512)
  private String url;

  /** Optional caller-supplied HMAC secret; one is generated when absent. */
  @Size(max = 128)
  private String secret;

  /** Java regex matched against event type; null/blank = all events. */
  @Size(max = 256)
  private String eventPattern;
}
