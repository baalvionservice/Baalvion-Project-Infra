package com.baalvion.credit.repository;

import com.baalvion.credit.domain.BnplInstallment;
import com.baalvion.credit.domain.BnplInstallment.InstallmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BnplInstallmentRepository extends JpaRepository<BnplInstallment, UUID> {

  List<BnplInstallment> findByPlanIdOrderBySequenceNoAsc(UUID planId);

  Optional<BnplInstallment> findByIdAndTenantId(UUID id, UUID tenantId);

  /** Earliest still-owing installment, used to allocate a repayment. */
  List<BnplInstallment> findByPlanIdAndStatusInOrderBySequenceNoAsc(UUID planId, List<InstallmentStatus> statuses);

  /** Installments past due and not settled — swept to OVERDUE. */
  List<BnplInstallment> findByStatusInAndDueDateBefore(List<InstallmentStatus> statuses, LocalDate date);
}
