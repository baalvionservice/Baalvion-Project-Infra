package com.baalvion.escrow.repository;

import com.baalvion.escrow.domain.Escrow;
import com.baalvion.escrow.domain.Escrow.EscrowStatus;
import com.baalvion.escrow.domain.Escrow.ReleaseCondition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, UUID> {

  @Query("SELECT e FROM Escrow e WHERE e.tenantId = :tenantId AND e.escrowRef = :ref")
  Optional<Escrow> findByTenantAndRef(
    @Param("tenantId") UUID tenantId,
    @Param("ref") String ref
  );

  @Query("SELECT e FROM Escrow e WHERE e.tenantId = :tenantId AND e.id = :id")
  Optional<Escrow> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT e FROM Escrow e WHERE e.tenantId = :tenantId ORDER BY e.createdAt DESC")
  Page<Escrow> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT e FROM Escrow e WHERE e.tenantId = :tenantId AND e.status = :status")
  Page<Escrow> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") EscrowStatus status,
    Pageable pageable
  );

  /**
   * TIME_BASED holds whose release time has elapsed and are still HELD — picked up by
   * the scheduled expiry sweep. The table owner (postgres) bypasses RLS, so the
   * background job sees rows across all tenants.
   */
  @Query("SELECT e FROM Escrow e WHERE e.status = :held AND e.releaseCondition = :timeBased "
    + "AND e.releaseAt IS NOT NULL AND e.releaseAt <= :now")
  List<Escrow> findExpiredHolds(
    @Param("held") EscrowStatus held,
    @Param("timeBased") ReleaseCondition timeBased,
    @Param("now") LocalDateTime now
  );
}
