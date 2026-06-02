package com.baalvion.aml.repository;

import com.baalvion.aml.domain.AmlAlert;
import com.baalvion.aml.domain.AmlAlert.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AmlAlertRepository extends JpaRepository<AmlAlert, UUID> {

  Optional<AmlAlert> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<AmlAlert> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<AmlAlert> findByTenantId(UUID tenantId, Pageable pageable);

  Page<AmlAlert> findByTenantIdAndStatus(UUID tenantId, AlertStatus status, Pageable pageable);
}
