package com.baalvion.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordEventRequest {

  @NotBlank(message = "Event type required")
  @Size(max = 128)
  private String eventType;

  @Size(max = 64)
  private String aggregateType;

  @Size(max = 128)
  private String aggregateId;

  @Size(max = 64)
  private String action;

  @Size(max = 128)
  private String actor;

  @Size(max = 64)
  private String source;

  /** Raw JSON payload (object). Stored verbatim in JSONB. */
  private String payload;
}
