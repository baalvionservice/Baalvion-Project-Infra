package com.baalvion.tradefinance.provider;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Port to the external issuing-bank / correspondent-bank network (e.g. SWIFT MT700 for a
 * documentary credit, MT760 for a guarantee). Implementations are selected by
 * {@code app.trade-finance.issuing-bank-provider}; the default {@link SimulatedIssuingBankAdapter}
 * is self-contained for local/dev, and a real SWIFT adapter can be dropped in for production
 * without touching the domain services.
 */
public interface IssuingBankAdapter {

  /** Registers a documentary credit with the issuing/correspondent bank; returns its reference (e.g. MT700 ref). */
  String registerCredit(UUID tenantId, String lcNumber, BigDecimal amount, String currency, String beneficiaryName);

  /** Registers an independent guarantee with the guarantor bank; returns its reference (e.g. MT760 ref). */
  String registerGuarantee(UUID tenantId, String guaranteeNumber, BigDecimal amount, String currency, String beneficiaryName);

  /** Identifier of the active provider, surfaced in logs/responses for traceability. */
  String providerName();
}
