package com.baalvion.settlement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBatchRequest {

  @NotBlank(message = "Batch reference required")
  @Size(max = 64)
  private String batchRef;

  @NotBlank(message = "Scheme required")
  private String scheme;

  @NotBlank(message = "Settlement type required")
  private String settlementType;

  @NotNull(message = "Settlement date required")
  private LocalDate settlementDate;

  @NotBlank(message = "Currency required")
  @Size(min = 3, max = 3, message = "Currency must be ISO 4217 code (3 chars)")
  private String currency;

  @NotEmpty(message = "At least one settlement item is required")
  @Valid
  private List<SettlementItemRequest> items;
}
