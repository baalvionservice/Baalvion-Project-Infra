package com.baalvion.risk.repository;

import com.baalvion.risk.domain.RiskAssessment;
import com.baalvion.risk.domain.RiskAssessment.Decision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {

  @Query("SELECT r FROM RiskAssessment r WHERE r.tenantId = :tenantId AND r.id = :id")
  Optional<RiskAssessment> findByIdAndTenant(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

  @Query("SELECT r FROM RiskAssessment r WHERE r.tenantId = :tenantId AND r.transactionId = :txnId")
  Optional<RiskAssessment> findByTenantAndTransaction(@Param("tenantId") UUID tenantId, @Param("txnId") UUID txnId);

  @Query("SELECT r FROM RiskAssessment r WHERE r.tenantId = :tenantId ORDER BY r.createdAt DESC")
  Page<RiskAssessment> findByTenant(@Param("tenantId") UUID tenantId, Pageable pageable);

  @Query("SELECT r FROM RiskAssessment r WHERE r.tenantId = :tenantId AND r.decision = :decision ORDER BY r.createdAt DESC")
  Page<RiskAssessment> findByTenantAndDecision(@Param("tenantId") UUID tenantId, @Param("decision") Decision decision, Pageable pageable);

  /** Velocity: number of prior assessments for this source account within the window. */
  @Query("SELECT COUNT(r) FROM RiskAssessment r WHERE r.tenantId = :tenantId AND r.sourceAccountId = :sourceId AND r.createdAt >= :since")
  long countRecentBySource(@Param("tenantId") UUID tenantId, @Param("sourceId") UUID sourceId, @Param("since") LocalDateTime since);

  /** Velocity: total amount from this source account within the window. */
  @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RiskAssessment r WHERE r.tenantId = :tenantId AND r.sourceAccountId = :sourceId AND r.createdAt >= :since")
  BigDecimal sumRecentBySource(@Param("tenantId") UUID tenantId, @Param("sourceId") UUID sourceId, @Param("since") LocalDateTime since);
}
