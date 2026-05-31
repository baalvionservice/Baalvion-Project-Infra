package com.baalvion.credit.repository;

import com.baalvion.credit.domain.FinancedInvoice;
import com.baalvion.credit.domain.FinancedInvoice.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinancedInvoiceRepository extends JpaRepository<FinancedInvoice, UUID> {

  Optional<FinancedInvoice> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<FinancedInvoice> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<FinancedInvoice> findByTenantId(UUID tenantId, Pageable pageable);

  Page<FinancedInvoice> findByTenantIdAndStatus(UUID tenantId, InvoiceStatus status, Pageable pageable);

  Page<FinancedInvoice> findByTenantIdAndSellerId(UUID tenantId, UUID sellerId, Pageable pageable);

  // --- risk history for a debtor (counterparty) ---
  long countByTenantIdAndDebtorIdAndStatus(UUID tenantId, UUID debtorId, InvoiceStatus status);

  List<FinancedInvoice> findByTenantIdAndDebtorIdAndStatusIn(UUID tenantId, UUID debtorId, List<InvoiceStatus> statuses);

  // --- scheduled delinquency sweep ---
  List<FinancedInvoice> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate date);
}
