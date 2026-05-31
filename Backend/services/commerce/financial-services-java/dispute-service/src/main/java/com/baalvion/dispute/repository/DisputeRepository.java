package com.baalvion.dispute.repository;

import com.baalvion.dispute.domain.Dispute;
import com.baalvion.dispute.domain.Dispute.DisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

  Optional<Dispute> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<Dispute> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<Dispute> findByTenantId(UUID tenantId, Pageable pageable);

  Page<Dispute> findByTenantIdAndStatus(UUID tenantId, DisputeStatus status, Pageable pageable);

  List<Dispute> findByStatusInAndDeadlineAtBefore(List<DisputeStatus> statuses, LocalDateTime cutoff);
}
