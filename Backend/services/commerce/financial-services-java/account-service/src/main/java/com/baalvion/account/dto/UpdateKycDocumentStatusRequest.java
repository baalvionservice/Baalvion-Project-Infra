package com.baalvion.account.dto;

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
public class UpdateKycDocumentStatusRequest {

  @NotBlank(message = "status required (PENDING|VERIFIED|REJECTED)")
  private String status;

  @Size(max = 128)
  private String reviewedBy;
}
