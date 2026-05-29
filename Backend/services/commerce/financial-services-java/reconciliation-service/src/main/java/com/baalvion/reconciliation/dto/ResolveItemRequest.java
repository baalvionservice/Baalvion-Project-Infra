package com.baalvion.reconciliation.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveItemRequest {

  @Size(max = 128, message = "resolvedBy must not exceed 128 characters")
  private String resolvedBy;

  @Size(max = 512, message = "Resolution note must not exceed 512 characters")
  private String resolutionNote;
}
