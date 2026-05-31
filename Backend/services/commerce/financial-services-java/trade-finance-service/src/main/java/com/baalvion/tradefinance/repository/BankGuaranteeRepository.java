package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.BankGuarantee;
import com.baalvion.tradefinance.domain.BankGuarantee.GuaranteeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankGuaranteeRepository extends JpaRepository<BankGuarantee, UUID> {

  Optional<BankGuarantee> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<BankGuarantee> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndGuaranteeNumber(UUID tenantId, String guaranteeNumber);

  Page<BankGuarantee> findByTenantId(UUID tenantId, Pageable pageable);

  Page<BankGuarantee> findByTenantIdAndStatus(UUID tenantId, GuaranteeStatus status, Pageable pageable);

  Page<BankGuarantee> findByTenantIdAndBeneficiaryId(UUID tenantId, UUID beneficiaryId, Pageable pageable);

  long countByTenantId(UUID tenantId);

  /** Active guarantees past expiry that do NOT auto-extend — swept to EXPIRED by the scheduled job. */
  List<BankGuarantee> findByStatusInAndAutoExtendFalseAndExpiryDateBefore(List<GuaranteeStatus> statuses, LocalDate date);
}
