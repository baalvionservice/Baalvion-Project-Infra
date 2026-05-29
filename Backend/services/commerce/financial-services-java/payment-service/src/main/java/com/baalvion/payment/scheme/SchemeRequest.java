package com.baalvion.payment.scheme;

import com.baalvion.payment.domain.Transaction.PaymentScheme;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The context a scheme adapter needs to route a payment. Richer than a bare amount so adapters
 * can build real scheme messages (ISO 8583 etc.). No PAN/cardholder data is carried here —
 * card schemes obtain tokens out of band (PCI: cardholder data is never stored).
 */
public record SchemeRequest(
  PaymentScheme scheme,
  BigDecimal amount,
  String currency,
  UUID sourceAccountId,
  UUID destinationAccountId,
  String reference
) {}
