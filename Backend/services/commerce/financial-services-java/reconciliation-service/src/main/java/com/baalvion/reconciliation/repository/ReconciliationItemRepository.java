package com.baalvion.reconciliation.repository;

import com.baalvion.reconciliation.domain.ReconciliationItem;
import com.baalvion.reconciliation.domain.ReconciliationItem.ItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationItemRepository extends JpaRepository<ReconciliationItem, UUID> {

  @Query("SELECT i FROM ReconciliationItem i WHERE i.tenantId = :tenantId AND i.id = :id")
  Optional<ReconciliationItem> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT i FROM ReconciliationItem i WHERE i.tenantId = :tenantId AND i.runId = :runId ORDER BY i.createdAt ASC")
  List<ReconciliationItem> findByRun(
    @Param("tenantId") UUID tenantId,
    @Param("runId") UUID runId
  );

  @Query("SELECT i FROM ReconciliationItem i WHERE i.tenantId = :tenantId AND i.status = :status")
  Page<ReconciliationItem> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") ItemStatus status,
    Pageable pageable
  );

  @Query("SELECT i FROM ReconciliationItem i WHERE i.tenantId = :tenantId ORDER BY i.createdAt DESC")
  Page<ReconciliationItem> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );
}
