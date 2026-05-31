package com.baalvion.credit.repository;

import com.baalvion.credit.domain.BnplPlan;
import com.baalvion.credit.domain.BnplPlan.BnplStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BnplPlanRepository extends JpaRepository<BnplPlan, UUID> {

  Optional<BnplPlan> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<BnplPlan> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<BnplPlan> findByTenantId(UUID tenantId, Pageable pageable);

  Page<BnplPlan> findByTenantIdAndStatus(UUID tenantId, BnplStatus status, Pageable pageable);

  Page<BnplPlan> findByTenantIdAndBuyerId(UUID tenantId, UUID buyerId, Pageable pageable);

  // --- risk history for a buyer (counterparty) ---
  long countByTenantIdAndBuyerIdAndStatus(UUID tenantId, UUID buyerId, BnplStatus status);

  List<BnplPlan> findByTenantIdAndBuyerIdAndStatusIn(UUID tenantId, UUID buyerId, List<BnplStatus> statuses);
}
