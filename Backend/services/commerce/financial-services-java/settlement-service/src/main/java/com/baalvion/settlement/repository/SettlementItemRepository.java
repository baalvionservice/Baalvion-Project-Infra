package com.baalvion.settlement.repository;

import com.baalvion.settlement.domain.SettlementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementItemRepository extends JpaRepository<SettlementItem, UUID> {

  @Query("SELECT i FROM SettlementItem i WHERE i.tenantId = :tenantId AND i.batchId = :batchId ORDER BY i.createdAt ASC")
  List<SettlementItem> findByBatch(
    @Param("tenantId") UUID tenantId,
    @Param("batchId") UUID batchId
  );

  @Query("SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END FROM SettlementItem i "
    + "WHERE i.tenantId = :tenantId AND i.transactionId = :transactionId")
  boolean existsByTenantAndTransaction(@Param("tenantId") UUID tenantId, @Param("transactionId") UUID transactionId);
}
