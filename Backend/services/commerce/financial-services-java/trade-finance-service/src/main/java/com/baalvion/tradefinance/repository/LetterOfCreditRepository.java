package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.LetterOfCredit;
import com.baalvion.tradefinance.domain.LetterOfCredit.LcStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LetterOfCreditRepository extends JpaRepository<LetterOfCredit, UUID> {

  Optional<LetterOfCredit> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<LetterOfCredit> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndLcNumber(UUID tenantId, String lcNumber);

  Page<LetterOfCredit> findByTenantId(UUID tenantId, Pageable pageable);

  Page<LetterOfCredit> findByTenantIdAndStatus(UUID tenantId, LcStatus status, Pageable pageable);

  Page<LetterOfCredit> findByTenantIdAndBeneficiaryId(UUID tenantId, UUID beneficiaryId, Pageable pageable);

  long countByTenantId(UUID tenantId);

  /** Active credits whose expiry date has passed — swept to EXPIRED by the scheduled job. */
  List<LetterOfCredit> findByStatusInAndExpiryDateBefore(List<LcStatus> statuses, LocalDate date);
}
