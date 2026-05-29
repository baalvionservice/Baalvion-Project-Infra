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
public class UpdateKycRequest {

  @NotBlank(message = "Target KYC status required")
  private String kycStatus;

  @Size(max = 128, message = "updatedBy must not exceed 128 characters")
  private String updatedBy;

  @Size(max = 512, message = "Reason must not exceed 512 characters")
  private String reason;
}
