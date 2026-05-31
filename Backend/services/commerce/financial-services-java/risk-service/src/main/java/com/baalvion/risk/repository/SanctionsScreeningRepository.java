package com.baalvion.risk.repository;

import com.baalvion.risk.domain.SanctionsScreening;
import com.baalvion.risk.domain.SanctionsScreening.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SanctionsScreeningRepository extends JpaRepository<SanctionsScreening, UUID> {

  Optional<SanctionsScreening> findByIdAndTenantId(UUID id, UUID tenantId);

  Page<SanctionsScreening> findByTenantId(UUID tenantId, Pageable pageable);

  Page<SanctionsScreening> findByTenantIdAndStatus(UUID tenantId, Status status, Pageable pageable);
}
