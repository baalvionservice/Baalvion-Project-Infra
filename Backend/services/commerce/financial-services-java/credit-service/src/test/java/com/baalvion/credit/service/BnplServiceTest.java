package com.baalvion.credit.service;

import com.baalvion.credit.config.CreditProperties;
import com.baalvion.credit.domain.BnplInstallment;
import com.baalvion.credit.domain.BnplPlan;
import com.baalvion.credit.dto.BnplPlanResponse;
import com.baalvion.credit.dto.CreateBnplPlanRequest;
import com.baalvion.credit.repository.BnplInstallmentRepository;
import com.baalvion.credit.repository.BnplPlanRepository;
import com.baalvion.credit.repository.BnplRepaymentRepository;
import com.baalvion.credit.risk.CreditRiskEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BnplServiceTest {

  private BnplPlanRepository planRepo;
  private BnplInstallmentRepository instRepo;
  private BnplRepaymentRepository repayRepo;
  private OutboxService outbox;
  private BnplService service;

  private final UUID tenant = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    planRepo = mock(BnplPlanRepository.class);
    instRepo = mock(BnplInstallmentRepository.class);
    repayRepo = mock(BnplRepaymentRepository.class);
    outbox = mock(OutboxService.class);

    when(planRepo.findByTenantIdAndIdempotencyKey(any(), any())).thenReturn(Optional.empty());
    when(planRepo.existsByTenantIdAndReference(any(), any())).thenReturn(false);
    when(planRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(planRepo.countByTenantIdAndBuyerIdAndStatus(any(), any(), any())).thenReturn(0L);

    service = new BnplService(planRepo, instRepo, repayRepo, new CreditRiskEngine(), outbox, new CreditProperties());
  }

  @Test
  void create_installmentPlan_buildsScheduleThatSumsToTotalPayable() {
    CreateBnplPlanRequest req = new CreateBnplPlanRequest();
    req.setBuyerName("Buyer Co");
    req.setMerchantName("Merchant Co");
    req.setPrincipal(new BigDecimal("12000"));
    req.setCurrency("USD");
    req.setTermType("INSTALLMENTS");
    req.setInstallmentCount(3);

    BnplPlanResponse res = service.create(tenant, req);

    assertThat(res.getStatus()).isEqualTo("APPROVED");
    assertThat(res.getInstallmentCount()).isEqualTo(3);
    assertThat(res.getTotalPayable()).isEqualByComparingTo(res.getPrincipal().add(res.getInterestAmount()));

    ArgumentCaptor<List<BnplInstallment>> captor = ArgumentCaptor.forClass(List.class);
    verify(instRepo).saveAll(captor.capture());
    List<BnplInstallment> schedule = captor.getValue();
    assertThat(schedule).hasSize(3);

    BigDecimal scheduledTotal = schedule.stream().map(BnplInstallment::getAmount)
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    // The installment amounts must reconcile exactly to the total payable (last absorbs rounding).
    assertThat(scheduledTotal).isEqualByComparingTo(res.getTotalPayable());
    BigDecimal principalTotal = schedule.stream().map(BnplInstallment::getPrincipalComponent)
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    assertThat(principalTotal).isEqualByComparingTo(res.getPrincipal());
  }

  @Test
  void create_bulletPlan_hasSingleInstallment() {
    CreateBnplPlanRequest req = new CreateBnplPlanRequest();
    req.setBuyerName("Buyer Co");
    req.setMerchantName("Merchant Co");
    req.setPrincipal(new BigDecimal("5000"));
    req.setCurrency("USD");
    req.setTermType("BULLET");
    req.setTenorDays(60);

    service.create(tenant, req);

    ArgumentCaptor<List<BnplInstallment>> captor = ArgumentCaptor.forClass(List.class);
    verify(instRepo).saveAll(captor.capture());
    assertThat(captor.getValue()).hasSize(1);
    assertThat(captor.getValue().get(0).getAmount()).isPositive();
  }
}
