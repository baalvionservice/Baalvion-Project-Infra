package com.baalvion.credit.dto;

import com.baalvion.credit.domain.InvoiceCollection;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InvoiceCollectionResponse {
  private UUID id;
  private UUID invoiceId;
  private BigDecimal amount;
  private String reference;
  private String createdBy;
  private LocalDateTime createdAt;

  public static InvoiceCollectionResponse from(InvoiceCollection c) {
    return InvoiceCollectionResponse.builder()
      .id(c.getId())
      .invoiceId(c.getInvoiceId())
      .amount(c.getAmount())
      .reference(c.getReference())
      .createdBy(c.getCreatedBy())
      .createdAt(c.getCreatedAt())
      .build();
  }
}
