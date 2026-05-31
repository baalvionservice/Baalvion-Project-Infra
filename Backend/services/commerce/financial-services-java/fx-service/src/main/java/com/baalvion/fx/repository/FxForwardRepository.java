package com.baalvion.fx.repository;

import com.baalvion.fx.domain.FxForward;
import com.baalvion.fx.domain.FxForward.ForwardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FxForwardRepository extends JpaRepository<FxForward, UUID> {

  Optional<FxForward> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<FxForward> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  Page<FxForward> findByTenantId(UUID tenantId, Pageable pageable);

  Page<FxForward> findByTenantIdAndStatus(UUID tenantId, ForwardStatus status, Pageable pageable);
}
