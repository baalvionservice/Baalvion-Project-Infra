package com.baalvion.smartcontract.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.smartcontract.config.SmartContractProperties;
import com.baalvion.smartcontract.domain.ContractSignature;
import com.baalvion.smartcontract.domain.ContractSignature.Party;
import com.baalvion.smartcontract.domain.ContractSignature.SignatureStatus;
import com.baalvion.smartcontract.domain.TradeContract;
import com.baalvion.smartcontract.domain.TradeContract.ContractStatus;
import com.baalvion.smartcontract.domain.TradeContract.Incoterm;
import com.baalvion.smartcontract.domain.TradeContract.OriginType;
import com.baalvion.smartcontract.domain.TradeContract.PaymentMethod;
import com.baalvion.smartcontract.dto.*;
import com.baalvion.smartcontract.exception.NotFoundException;
import com.baalvion.smartcontract.provider.ESignatureProvider;
import com.baalvion.smartcontract.repository.ContractSignatureRepository;
import com.baalvion.smartcontract.repository.TradeContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Contract lifecycle: assemble a binding sale contract from agreed terms (Incoterms 2020 + UCP 600
 * clauses), route it for e-signature through the pluggable provider, record signatures, and reach
 * EXECUTED when every party has signed — emitting outbox events for the order / trade-finance /
 * logistics services.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SmartContractService {

  private static final int MONEY_SCALE = 4;

  private final TradeContractRepository contractRepository;
  private final ContractSignatureRepository signatureRepository;
  private final OutboxService outbox;
  private final ESignatureProvider esign;
  private final ClauseBuilder clauseBuilder;
  private final SmartContractProperties props;

  // --------------------------------------------------------------------------- create / read

  public ContractResponse create(UUID tenantId, CreateContractRequest req) {
    String idem = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();
    var existing = contractRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent contract create: key={} exists for tenant={}", idem, tenantId);
      return withSignatures(existing.get());
    }

    validateCurrency(req.getCurrency());
    Incoterm incoterm = parseEnum(Incoterm.class, req.getIncoterm(), "incoterm");
    PaymentMethod payment = req.getPaymentMethod() != null
      ? parseEnum(PaymentMethod.class, req.getPaymentMethod(), "paymentMethod") : PaymentMethod.TT;
    BigDecimal price = req.getPrice().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    BigDecimal qty = req.getQuantity().setScale(MONEY_SCALE, RoundingMode.HALF_UP);

    String governingLaw = req.getGoverningLaw() != null ? req.getGoverningLaw() : props.getDefaultGoverningLaw();
    String dispute = req.getDisputeResolution() != null ? req.getDisputeResolution() : props.getDefaultDisputeResolution();

    TradeContract contract = TradeContract.builder()
      .tenantId(tenantId)
      .idempotencyKey(idem)
      .contractNumber(generateContractNumber(tenantId))
      .originType(req.getOriginType() != null ? parseEnum(OriginType.class, req.getOriginType(), "originType") : OriginType.DEAL)
      .originId(req.getOriginId()).dealId(req.getDealId()).termSheetId(req.getTermSheetId())
      .buyerId(req.getBuyerId()).buyerName(req.getBuyerName())
      .sellerId(req.getSellerId()).sellerName(req.getSellerName())
      .commodity(req.getCommodity()).description(req.getDescription())
      .quantity(qty).unit(req.getUnit()).price(price).currency(req.getCurrency().toUpperCase())
      .totalValue(price.multiply(qty).setScale(MONEY_SCALE, RoundingMode.HALF_UP))
      .incoterm(incoterm).namedPlace(req.getNamedPlace()).paymentMethod(payment)
      .deliveryDate(req.getDeliveryDate()).portOfLoading(req.getPortOfLoading()).portOfDischarge(req.getPortOfDischarge())
      .governingLaw(governingLaw).disputeResolution(dispute)
      .clauses(clauseBuilder.build(incoterm, payment, req.getNamedPlace(), governingLaw, dispute))
      .status(ContractStatus.ISSUED)
      .esignProvider(esign.providerName())
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .issuedAt(LocalDateTime.now())
      .build();
    TradeContract saved = contractRepository.save(contract);

    signatureRepository.save(ContractSignature.builder()
      .contractId(saved.getId()).tenantId(tenantId).party(Party.BUYER)
      .signerName(req.getBuyerSignerName()).signerEmail(req.getBuyerSignerEmail()).build());
    signatureRepository.save(ContractSignature.builder()
      .contractId(saved.getId()).tenantId(tenantId).party(Party.SELLER)
      .signerName(req.getSellerSignerName()).signerEmail(req.getSellerSignerEmail()).build());

    log.info("Contract issued: id={}, number={}, tenant={}, value={} {}",
      saved.getId(), saved.getContractNumber(), tenantId, saved.getTotalValue(), saved.getCurrency());
    outbox.enqueue(tenantId, "smartcontract.contract.issued", saved.getId().toString(), ContractResponse.from(saved));
    return withSignatures(saved);
  }

  @Transactional(readOnly = true)
  public ContractResponse get(UUID tenantId, UUID id) {
    return withSignatures(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<ContractResponse> list(UUID tenantId, String status, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<TradeContract> result = (status != null)
      ? contractRepository.findByTenantIdAndStatus(tenantId, parseEnum(ContractStatus.class, status, "status"), pageable)
      : contractRepository.findByTenantId(tenantId, pageable);
    return result.map(ContractResponse::from);
  }

  // --------------------------------------------------------------------------- signature flow

  public ContractResponse sendForSignature(UUID tenantId, UUID id) {
    TradeContract c = load(tenantId, id);
    if (c.getStatus() != ContractStatus.ISSUED && c.getStatus() != ContractStatus.DRAFT) {
      throw new IllegalStateException("Only an ISSUED/DRAFT contract can be sent for signature (was " + c.getStatus() + ")");
    }
    List<ContractSignature> sigs = signatureRepository.findByContractId(id);
    List<ESignatureProvider.Signer> signers = sigs.stream()
      .map(s -> new ESignatureProvider.Signer(s.getParty().name(), s.getSignerName(), s.getSignerEmail())).toList();
    String envelopeId = esign.createEnvelope(tenantId, id, c.getContractNumber(), signers);

    c.setEnvelopeId(envelopeId);
    c.setEsignProvider(esign.providerName());
    c.setStatus(ContractStatus.OUT_FOR_SIGNATURE);
    contractRepository.save(c);
    for (ContractSignature s : sigs) { s.setProviderRef(envelopeId + ":" + s.getParty().name()); signatureRepository.save(s); }

    log.info("Contract sent for signature: id={}, envelope={}, provider={}, tenant={}", id, envelopeId, esign.providerName(), tenantId);
    outbox.enqueue(tenantId, "smartcontract.contract.sent_for_signature", id.toString(), ContractResponse.from(c));
    return withSignatures(c);
  }

  /** Records one party's signature. The contract becomes EXECUTED once every party has signed. */
  public ContractResponse recordSignature(UUID tenantId, UUID id, String party, String signerName, String ip) {
    TradeContract c = load(tenantId, id);
    if (c.getStatus() != ContractStatus.OUT_FOR_SIGNATURE && c.getStatus() != ContractStatus.SIGNED) {
      throw new IllegalStateException("Contract is not out for signature (was " + c.getStatus() + ")");
    }
    Party p = parseEnum(Party.class, party, "party");
    ContractSignature sig = signatureRepository.findByContractIdAndParty(id, p)
      .orElseThrow(() -> new NotFoundException("No signature slot for party " + p + " on contract " + id));
    if (sig.getStatus() == SignatureStatus.SIGNED) throw new IllegalStateException(p + " has already signed");
    if (sig.getStatus() == SignatureStatus.DECLINED) throw new IllegalStateException(p + " has declined; contract must be re-issued");

    sig.setStatus(SignatureStatus.SIGNED);
    sig.setSignedAt(LocalDateTime.now());
    if (signerName != null) sig.setSignerName(signerName);
    sig.setIpAddress(ip);
    signatureRepository.save(sig);
    outbox.enqueue(tenantId, "smartcontract.contract.signed", id.toString(), SignatureResponse.from(sig));

    boolean allSigned = signatureRepository.findByContractId(id).stream()
      .allMatch(s -> s.getStatus() == SignatureStatus.SIGNED);
    if (allSigned) {
      c.setStatus(ContractStatus.EXECUTED);
      c.setExecutedAt(LocalDateTime.now());
      contractRepository.save(c);
      log.info("Contract EXECUTED: id={}, number={}, tenant={}", id, c.getContractNumber(), tenantId);
      outbox.enqueue(tenantId, "smartcontract.contract.executed", id.toString(), ContractResponse.from(c));
    } else {
      c.setStatus(ContractStatus.SIGNED); // at least one signature in
      contractRepository.save(c);
    }
    return withSignatures(c);
  }

  public ContractResponse declineSignature(UUID tenantId, UUID id, String party, String reason) {
    TradeContract c = load(tenantId, id);
    Party p = parseEnum(Party.class, party, "party");
    ContractSignature sig = signatureRepository.findByContractIdAndParty(id, p)
      .orElseThrow(() -> new NotFoundException("No signature slot for party " + p + " on contract " + id));
    sig.setStatus(SignatureStatus.DECLINED);
    sig.setDeclinedReason(reason);
    signatureRepository.save(sig);
    voidInternal(c, "Signature declined by " + p + (reason != null ? ": " + reason : ""));
    return withSignatures(c);
  }

  public ContractResponse voidContract(UUID tenantId, UUID id, String reason) {
    TradeContract c = load(tenantId, id);
    if (c.getStatus() == ContractStatus.EXECUTED || c.getStatus() == ContractStatus.VOID || c.getStatus() == ContractStatus.TERMINATED) {
      throw new IllegalStateException("Contract is terminal (" + c.getStatus() + ") and cannot be voided");
    }
    voidInternal(c, reason);
    return withSignatures(c);
  }

  @Transactional(readOnly = true)
  public List<SignatureResponse> getSignatures(UUID tenantId, UUID id) {
    load(tenantId, id);
    return signatureRepository.findByContractId(id).stream().map(SignatureResponse::from).toList();
  }

  // --------------------------------------------------------------------------- helpers

  private void voidInternal(TradeContract c, String reason) {
    if (c.getEnvelopeId() != null) {
      try { esign.voidEnvelope(c.getEnvelopeId()); } catch (Exception e) { log.warn("voidEnvelope failed: {}", e.getMessage()); }
    }
    c.setStatus(ContractStatus.VOID);
    contractRepository.save(c);
    log.info("Contract voided: id={}, reason={}", c.getId(), reason);
    outbox.enqueue(c.getTenantId(), "smartcontract.contract.voided", c.getId().toString(), ContractResponse.from(c));
  }

  private ContractResponse withSignatures(TradeContract c) {
    List<SignatureResponse> sigs = signatureRepository.findByContractId(c.getId()).stream()
      .map(SignatureResponse::from).toList();
    return ContractResponse.from(c, new ArrayList<>(sigs));
  }

  private TradeContract load(UUID tenantId, UUID id) {
    return contractRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Contract not found: " + id));
  }

  private String generateContractNumber(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "SC-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!contractRepository.existsByTenantIdAndContractNumber(tenantId, candidate)) return candidate;
    }
    throw new IllegalStateException("Unable to allocate a unique contract number");
  }

  private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
    try {
      return Enum.valueOf(type, value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid " + field + ": " + value);
    }
  }

  private void validateCurrency(String currency) {
    if (currency == null || currency.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
  }
}
