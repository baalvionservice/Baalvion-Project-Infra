package com.baalvion.reconciliation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconcileRequest {

  @NotBlank(message = "Run reference required")
  @Size(max = 64)
  private String runRef;

  @Size(max = 128)
  private String sourceFile;

  @Size(max = 64)
  private String batchRef;

  /** The platform's own records (ledger/payment side). */
  @NotNull(message = "internalRecords required")
  @Valid
  private List<ReconRecord> internalRecords;

  /** The inbound scheme advice records. */
  @NotNull(message = "externalRecords required")
  @Valid
  private List<ReconRecord> externalRecords;
}
