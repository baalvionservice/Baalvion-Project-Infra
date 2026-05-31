package com.baalvion.tradefinance.service;

import com.baalvion.tradefinance.config.TradeFinanceProperties;
import com.baalvion.tradefinance.domain.LetterOfCredit;
import com.baalvion.tradefinance.domain.LcPresentation;
import com.baalvion.tradefinance.dto.IssueLcRequest;
import com.baalvion.tradefinance.dto.LcPresentationResponse;
import com.baalvion.tradefinance.dto.LcResponse;
import com.baalvion.tradefinance.dto.PresentDocumentsRequest;
import com.baalvion.tradefinance.provider.SimulatedIssuingBankAdapter;
import com.baalvion.tradefinance.repository.LcAmendmentRepository;
import com.baalvion.tradefinance.repository.LcPresentationRepository;
import com.baalvion.tradefinance.repository.LetterOfCreditRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LetterOfCreditServiceTest {

  private LetterOfCreditRepository lcRepo;
  private LcAmendmentRepository amendRepo;
  private LcPresentationRepository presRepo;
  private OutboxService outbox;
  private LetterOfCreditService service;

  private final UUID tenant = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    lcRepo = mock(LetterOfCreditRepository.class);
    amendRepo = mock(LcAmendmentRepository.class);
    presRepo = mock(LcPresentationRepository.class);
    outbox = mock(OutboxService.class);
    TradeFinanceProperties props = new TradeFinanceProperties();

    when(lcRepo.findByTenantIdAndIdempotencyKey(any(), any())).thenReturn(Optional.empty());
    when(lcRepo.existsByTenantIdAndLcNumber(any(), any())).thenReturn(false);
    when(lcRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(presRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(presRepo.countByLcId(any())).thenReturn(0L);

    service = new LetterOfCreditService(lcRepo, amendRepo, presRepo, outbox,
      new SimulatedIssuingBankAdapter(), props, new ObjectMapper());
  }

  private IssueLcRequest validRequest() {
    IssueLcRequest req = new IssueLcRequest();
    req.setLcType("SIGHT");
    req.setApplicantName("Acme Importers Ltd");
    req.setBeneficiaryName("Pacific Exporters Co");
    req.setAmount(new BigDecimal("100000"));
    req.setCurrency("USD");
    req.setExpiryDate(LocalDate.now().plusMonths(3));
    req.setRequiredDocuments(List.of("COMMERCIAL_INVOICE", "BILL_OF_LADING"));
    return req;
  }

  @Test
  void issue_computesCommissionAndMargin_andStartsIssuedWithFullAvailability() {
    LcResponse res = service.issue(tenant, validRequest());

    assertThat(res.getStatus()).isEqualTo("ISSUED");
    assertThat(res.getAvailableAmount()).isEqualByComparingTo("100000");
    // 125 bps of 100,000 = 1,250.00
    assertThat(res.getCommissionAmount()).isEqualByComparingTo("1250.0000");
    // default margin 10% of 100,000 = 10,000.00
    assertThat(res.getMarginAmount()).isEqualByComparingTo("10000.0000");
    assertThat(res.getSchemeRef()).startsWith("MT700-");
    assertThat(res.getLcNumber()).startsWith("LC-");
    verify(outbox).enqueue(eq(tenant), eq("tradefinance.lc.issued"), any(), any());
  }

  @Test
  void issue_rejectsPastExpiry() {
    IssueLcRequest req = validRequest();
    req.setExpiryDate(LocalDate.now().minusDays(1));
    assertThatThrownBy(() -> service.issue(tenant, req))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("expiryDate");
  }

  @Test
  void settle_drawsDownAvailability_andClosesWhenFullyDrawn() {
    UUID lcId = UUID.randomUUID();
    LetterOfCredit lc = LetterOfCredit.builder()
      .id(lcId).tenantId(tenant).lcNumber("LC-2026-TEST").idempotencyKey("k")
      .lcType(LetterOfCredit.LcType.SIGHT).status(LetterOfCredit.LcStatus.DOCS_ACCEPTED)
      .applicantName("A").beneficiaryName("B")
      .amount(new BigDecimal("50000.0000")).availableAmount(new BigDecimal("50000.0000"))
      .settledAmount(BigDecimal.ZERO).currency("USD").tolerancePct(BigDecimal.ZERO)
      .expiryDate(LocalDate.now().plusMonths(1)).build();

    LcPresentation pres = LcPresentation.builder()
      .id(UUID.randomUUID()).lcId(lcId).tenantId(tenant).presentationNumber(1)
      .status(LcPresentation.PresentationStatus.COMPLYING)
      .presentedAmount(new BigDecimal("50000.0000")).build();

    when(lcRepo.findByIdAndTenantId(lcId, tenant)).thenReturn(Optional.of(lc));
    when(presRepo.findByIdAndTenantId(pres.getId(), tenant)).thenReturn(Optional.of(pres));

    LcPresentationResponse res = service.settle(tenant, lcId, pres.getId());

    assertThat(res.getStatus()).isEqualTo("SETTLED");
    assertThat(lc.getAvailableAmount()).isEqualByComparingTo("0");
    assertThat(lc.getSettledAmount()).isEqualByComparingTo("50000.0000");
    assertThat(lc.getStatus()).isEqualTo(LetterOfCredit.LcStatus.SETTLED);
    verify(outbox).enqueue(eq(tenant), eq("tradefinance.lc.settled"), any(), any());
  }
}
