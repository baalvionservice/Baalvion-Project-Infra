package com.baalvion.intelligence.repository;

import com.baalvion.intelligence.domain.SupplierRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRiskRepository extends JpaRepository<SupplierRisk, UUID> {

  Optional<SupplierRisk> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<SupplierRisk> findFirstByTenantIdAndSupplierIdOrderByAssessedAtDesc(UUID tenantId, UUID supplierId);
}
