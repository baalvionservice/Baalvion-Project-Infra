package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.GuaranteeClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GuaranteeClaimRepository extends JpaRepository<GuaranteeClaim, UUID> {

  List<GuaranteeClaim> findByGuaranteeIdOrderByClaimNumberAsc(UUID guaranteeId);

  Optional<GuaranteeClaim> findByIdAndTenantId(UUID id, UUID tenantId);

  long countByGuaranteeId(UUID guaranteeId);
}
