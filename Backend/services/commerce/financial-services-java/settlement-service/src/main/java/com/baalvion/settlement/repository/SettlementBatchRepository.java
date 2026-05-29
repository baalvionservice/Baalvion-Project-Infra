package com.baalvion.settlement.repository;

import com.baalvion.settlement.domain.SettlementBatch;
import com.baalvion.settlement.domain.SettlementBatch.BatchStatus;
import com.baalvion.settlement.domain.SettlementBatch.Scheme;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementBatchRepository extends JpaRepository<SettlementBatch, UUID> {

  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId AND b.batchRef = :ref")
  Optional<SettlementBatch> findByTenantAndRef(
    @Param("tenantId") UUID tenantId,
    @Param("ref") String ref
  );

  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId AND b.id = :id")
  Optional<SettlementBatch> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId ORDER BY b.settlementDate DESC, b.createdAt DESC")
  Page<SettlementBatch> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId AND b.status = :status")
  Page<SettlementBatch> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") BatchStatus status,
    Pageable pageable
  );

  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId AND b.scheme = :scheme")
  Page<SettlementBatch> findByTenantAndScheme(
    @Param("tenantId") UUID tenantId,
    @Param("scheme") Scheme scheme,
    Pageable pageable
  );

  /** The single open batch for a scheme/currency/date used by the completed-payment auto-feed. */
  @Query("SELECT b FROM SettlementBatch b WHERE b.tenantId = :tenantId AND b.scheme = :scheme "
    + "AND b.currency = :currency AND b.settlementDate = :date AND b.status = :status")
  Optional<SettlementBatch> findOpenBatch(
    @Param("tenantId") UUID tenantId,
    @Param("scheme") Scheme scheme,
    @Param("currency") String currency,
    @Param("date") java.time.LocalDate date,
    @Param("status") com.baalvion.settlement.domain.SettlementBatch.BatchStatus status
  );
}
