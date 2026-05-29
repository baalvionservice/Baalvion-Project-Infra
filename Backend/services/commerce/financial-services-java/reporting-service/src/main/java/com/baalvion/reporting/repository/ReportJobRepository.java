package com.baalvion.reporting.repository;

import com.baalvion.reporting.domain.ReportJob;
import com.baalvion.reporting.domain.ReportJob.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportJobRepository extends JpaRepository<ReportJob, UUID> {

  @Query("SELECT j FROM ReportJob j WHERE j.tenantId = :tenantId AND j.reportRef = :ref")
  Optional<ReportJob> findByTenantAndRef(
    @Param("tenantId") UUID tenantId,
    @Param("ref") String ref
  );

  @Query("SELECT j FROM ReportJob j WHERE j.tenantId = :tenantId AND j.id = :id")
  Optional<ReportJob> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT j FROM ReportJob j WHERE j.tenantId = :tenantId ORDER BY j.createdAt DESC")
  Page<ReportJob> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT j FROM ReportJob j WHERE j.tenantId = :tenantId AND j.status = :status")
  Page<ReportJob> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") ReportStatus status,
    Pageable pageable
  );
}
