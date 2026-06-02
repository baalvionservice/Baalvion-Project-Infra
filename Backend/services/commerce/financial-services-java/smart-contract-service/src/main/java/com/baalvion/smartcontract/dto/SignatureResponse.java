package com.baalvion.smartcontract.dto;

import com.baalvion.smartcontract.domain.ContractSignature;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SignatureResponse {
  private UUID id;
  private UUID contractId;
  private String party;
  private String signerName;
  private String signerEmail;
  private String status;
  private String providerRef;
  private LocalDateTime signedAt;
  private String declinedReason;

  public static SignatureResponse from(ContractSignature s) {
    return SignatureResponse.builder()
      .id(s.getId()).contractId(s.getContractId())
      .party(s.getParty() != null ? s.getParty().name() : null)
      .signerName(s.getSignerName()).signerEmail(s.getSignerEmail())
      .status(s.getStatus() != null ? s.getStatus().name() : null)
      .providerRef(s.getProviderRef()).signedAt(s.getSignedAt()).declinedReason(s.getDeclinedReason())
      .build();
  }
}
