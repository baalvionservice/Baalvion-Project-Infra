package com.baalvion.reporting.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReportRequest {

  @NotBlank(message = "Report reference required")
  @Size(max = 64)
  private String reportRef;

  @NotBlank(message = "Report type required")
  @Size(max = 64)
  private String reportType;

  @NotBlank(message = "Format required")
  private String format;

  /** Ordered column headers / keys. */
  @NotEmpty(message = "At least one column is required")
  private List<String> columns;

  /** Data rows, each keyed by column name. */
  @NotNull(message = "rows required (may be empty)")
  private List<Map<String, Object>> rows;

  /** Free-form filter context echoed back; stored as JSONB. */
  private Map<String, Object> parameters;

  @Size(max = 128)
  private String requestedBy;
}
