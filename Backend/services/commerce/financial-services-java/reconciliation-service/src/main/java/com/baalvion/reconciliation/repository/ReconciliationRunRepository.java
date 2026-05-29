package com.baalvion.reconciliation.repository;

import com.baalvion.reconciliation.domain.ReconciliationRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationRunRepository extends JpaRepository<ReconciliationRun, UUID> {

  @Query("SELECT r FROM ReconciliationRun r WHERE r.tenantId = :tenantId AND r.runRef = :ref")
  Optional<ReconciliationRun> findByTenantAndRef(
    @Param("tenantId") UUID tenantId,
    @Param("ref") String ref
  );

  @Query("SELECT r FROM ReconciliationRun r WHERE r.tenantId = :tenantId AND r.id = :id")
  Optional<ReconciliationRun> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT r FROM ReconciliationRun r WHERE r.tenantId = :tenantId ORDER BY r.createdAt DESC")
  Page<ReconciliationRun> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );
}
