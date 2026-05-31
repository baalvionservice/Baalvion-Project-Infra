package com.baalvion.smartcontract.provider;

import java.util.List;
import java.util.UUID;

/**
 * Port to the e-signature platform (DocuSeal in production). Implementations are selected by
 * {@code app.smart-contract.esign-provider}; the default {@link SimulatedESignatureProvider} is
 * self-contained for local/dev, and a real DocuSeal adapter can be dropped in without touching
 * the domain service.
 */
public interface ESignatureProvider {

  /** A party that must sign, with the role and contact the provider should route to. */
  record Signer(String party, String name, String email) {}

  /** Creates a signature envelope for a contract document; returns the provider envelope id. */
  String createEnvelope(UUID tenantId, UUID contractId, String contractNumber, List<Signer> signers);

  /** Voids/cancels an open envelope (e.g. on contract VOID). */
  void voidEnvelope(String envelopeId);

  /** Identifier of the active provider, surfaced in logs/responses for traceability. */
  String providerName();
}
