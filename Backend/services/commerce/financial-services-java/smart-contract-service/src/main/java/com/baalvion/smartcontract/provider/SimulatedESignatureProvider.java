package com.baalvion.smartcontract.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Self-contained e-signature provider for local/dev: allocates a deterministic envelope id and
 * logs the routing. Signatures are then recorded through the service API (or a provider webhook in
 * the real adapter). No external calls. Swap in a DocuSeal adapter for production via
 * {@code app.smart-contract.esign-provider=docuseal}.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.smart-contract.esign-provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedESignatureProvider implements ESignatureProvider {

  @Override
  public String createEnvelope(UUID tenantId, UUID contractId, String contractNumber, List<Signer> signers) {
    String envelopeId = "SIM-ENV-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    log.info("[esign:simulated] envelope {} created for contract {} ({} signers)", envelopeId, contractNumber, signers.size());
    return envelopeId;
  }

  @Override
  public void voidEnvelope(String envelopeId) {
    log.info("[esign:simulated] envelope {} voided", envelopeId);
  }

  @Override
  public String providerName() {
    return "simulated";
  }
}
