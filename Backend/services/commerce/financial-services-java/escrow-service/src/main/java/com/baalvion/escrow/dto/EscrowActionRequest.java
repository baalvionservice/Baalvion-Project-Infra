package com.baalvion.escrow.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Optional context for release/refund/dispute actions (reason and actor).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowActionRequest {

  @Size(max = 512, message = "Reason must not exceed 512 characters")
  private String reason;

  @Size(max = 128, message = "actor must not exceed 128 characters")
  private String actor;
}
