package com.baalvion.payment.repository;

import com.baalvion.payment.domain.ApprovalRequest;
import com.baalvion.payment.domain.ApprovalRequest.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {

  @Query("SELECT a FROM ApprovalRequest a WHERE a.tenantId = :tenantId AND a.id = :id")
  Optional<ApprovalRequest> findByIdAndTenant(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

  @Query("SELECT a FROM ApprovalRequest a WHERE a.tenantId = :tenantId ORDER BY a.createdAt DESC")
  Page<ApprovalRequest> findByTenant(@Param("tenantId") UUID tenantId, Pageable pageable);

  @Query("SELECT a FROM ApprovalRequest a WHERE a.tenantId = :tenantId AND a.status = :status ORDER BY a.createdAt DESC")
  Page<ApprovalRequest> findByTenantAndStatus(@Param("tenantId") UUID tenantId, @Param("status") Status status, Pageable pageable);
}
