package com.baalvion.dealroom.repository;

import com.baalvion.dealroom.domain.TermSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TermSheetRepository extends JpaRepository<TermSheet, UUID> {

  Optional<TermSheet> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<TermSheet> findByDealId(UUID dealId);
}
