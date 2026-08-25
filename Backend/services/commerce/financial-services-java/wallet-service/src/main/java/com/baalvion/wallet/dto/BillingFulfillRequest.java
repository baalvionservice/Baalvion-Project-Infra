package com.baalvion.wallet.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

/** Mirrors the JSON body payment-service's BillingFulfillmentClient.dispatch() sends. */
@Data
public class BillingFulfillRequest {
  private String provider;
  private String providerRef;
  private String eventId;
  private BigDecimal amountMinor;
  private String currency;
  private Map<String, Object> metadata;
}
