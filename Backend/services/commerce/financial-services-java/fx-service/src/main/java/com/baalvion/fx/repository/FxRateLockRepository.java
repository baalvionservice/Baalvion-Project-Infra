package com.baalvion.fx.repository;

import com.baalvion.fx.domain.FxRateLock;
import com.baalvion.fx.domain.FxRateLock.LockStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FxRateLockRepository extends JpaRepository<FxRateLock, UUID> {

  Optional<FxRateLock> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<FxRateLock> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  Page<FxRateLock> findByTenantId(UUID tenantId, Pageable pageable);

  Page<FxRateLock> findByTenantIdAndStatus(UUID tenantId, LockStatus status, Pageable pageable);

  List<FxRateLock> findByStatusAndExpiresAtBefore(LockStatus status, LocalDateTime cutoff);
}
