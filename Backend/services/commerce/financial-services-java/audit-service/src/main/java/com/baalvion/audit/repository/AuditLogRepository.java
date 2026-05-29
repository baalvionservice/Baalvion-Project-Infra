package com.baalvion.audit.repository;

import com.baalvion.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

  @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.id = :id")
  Optional<AuditLog> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId ORDER BY a.createdAt DESC")
  Page<AuditLog> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.eventType = :eventType ORDER BY a.createdAt DESC")
  Page<AuditLog> findByTenantAndEventType(
    @Param("tenantId") UUID tenantId,
    @Param("eventType") String eventType,
    Pageable pageable
  );

  @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.aggregateId = :aggregateId ORDER BY a.createdAt DESC")
  Page<AuditLog> findByTenantAndAggregateId(
    @Param("tenantId") UUID tenantId,
    @Param("aggregateId") String aggregateId,
    Pageable pageable
  );

  @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId AND a.actor = :actor ORDER BY a.createdAt DESC")
  Page<AuditLog> findByTenantAndActor(
    @Param("tenantId") UUID tenantId,
    @Param("actor") String actor,
    Pageable pageable
  );
}
